# Project Research Summary

**Project:** AgendamentoCilios
**Domain:** Solo beauty-professional appointment booking (with upfront Pix deposit + WhatsApp reminders) combined with online recorded-course sales and a student area — Brazilian market
**Researched:** 2026-09-18
**Confidence:** MEDIUM-HIGH

## Executive Summary

AgendamentoCilios is a two-sided product serving one solo operator: booking clients who need a frictionless self-service scheduling flow, and course students who need a persistent account with long-lived content access. Research across four dimensions converged on a clear recommendation: build it as a **single Next.js monolith**, not the separated `client/`/`server/` services the empty repo directories imply. At solo-operator scale, Server Actions remove the need for a separate REST API, and one deployable unit is dramatically simpler to operate. The existing `client/` and `server/` directories should be repurposed as internal module boundaries inside that single app.

The two open decisions flagged in PROJECT.md are now resolved with confidence. **Mercado Pago** wins the payment gateway choice on concrete fee math: 0.99% on Pix with no floor versus Asaas's flat R$1.99 per charge — breakeven sits around R$201, and this business is high-frequency small-ticket deposits, so Mercado Pago wins for essentially every transaction. **Meta's official WhatsApp Cloud API** wins the messaging choice on risk, not price: unofficial providers (Z-API, Evolution API) are cheaper but carry documented permanent-ban risk triggered by exactly the burst-send pattern automated reminders require — and this is the professional's only client communication channel, making the downside catastrophic rather than merely inconvenient.

The dominant risks are not framework choices but correctness and compliance. Three engineering patterns are non-negotiable and expensive to retrofit: a PostgreSQL `EXCLUDE` constraint to make double-booking structurally impossible, insert-first webhook idempotency with signature verification and authoritative status re-fetching, and reminder jobs that re-validate appointment state at send time rather than trusting what was true at schedule time. On the regulatory side, the planned "retain the deposit on no-show" rule collides with Brazilian consumer law — CDC Art. 49 grants an unconditional 7-day withdrawal right for purchases made outside a physical establishment (covering both bookings and course sales), and Art. 51 II voids clauses stripping refund rights. The deposit remains viable as a no-show deterrent, but the policy must be graduated and disclosed before payment rather than a blanket forfeiture.

## Key Findings

### Recommended Stack

A single Next.js application on Vercel, backed by managed Postgres, with Brazilian-market providers for the two integration-heavy concerns (payments and messaging). Every choice optimizes for a single operator with low traffic and no ops team — managed services over self-hosted, stable releases over betas.

**Core technologies:**
- **Next.js 16** (single monolith): both UI and server logic — Server Actions eliminate a separate API layer; `client/` and `server/` become internal directories, not services
- **PostgreSQL 17 + Neon**: system of record — the `EXCLUDE USING gist` constraint that prevents double-booking is a Postgres-specific capability and is the single most important schema decision
- **Prisma 7**: ORM — mature migrations; raw SQL escape hatch needed for the exclusion constraint and slot queries
- **Better Auth 1.7**: authentication — chosen over NextAuth/Auth.js v5, which remains beta after a year; supports the dual-identity model natively
- **Mercado Pago**: Pix deposits and course purchases — 0.99% Pix fee with no floor; Checkout/Payment Bricks give drop-in Pix UI; split/escrow irrelevant for a single receiver
- **Meta WhatsApp Cloud API**: confirmations and reminders — official path; requires Business verification and pre-approved Utility templates
- **Panda Video**: course video hosting — Brazilian, BRL billing, bundles DRM + dynamic watermark + domain lock at this scale
- **date-fns-tz**: timezone handling — store UTC, convert to `America/Sao_Paulo` only at compute and display boundaries

### Expected Features

The Brazilian solo-beauty-booking category (DottoVip, Bellagenda, Agende-me, Trinks, agendamento.link) has already converged on exactly the pattern PROJECT.md describes. Self-service link + Pix deposit + automatic WhatsApp reminders is **table stakes, not differentiation** — the product must match it, not invent it. The genuine differentiator is spanning both halves: no competitor studied covers booking and an owned course area under one identity system.

**Must have (table stakes):**
- Service catalog with per-service duration and price — lash techniques differ materially (clássico ~2h, volume russo ~2h30–3h+, híbrido ~2h, manutenção ~1–1.5h)
- Availability rules: working hours, days off, blocks, buffer/cleanup time between appointments, minimum lead time, booking horizon
- Self-service slot selection with real availability, no manual approval step
- Pix deposit as the confirmation gate for the appointment
- Guest-style booking identity (name + phone) — forcing account creation to book undermines the core value
- Automatic WhatsApp confirmation and reminders
- Professional's agenda view with reschedule and cancel
- Course catalog, purchase, and a student area with login
- Per-lesson progress tracking

**Should have (competitive):**
- Unified identity bridging booking clients and course students — the real differentiator
- Graduated, clearly disclosed cancellation and refund policy (also a legal requirement, not just UX)
- Multi-touch reminder cadence: a single 24h-out reminder cuts no-shows ~30%; adding a 1–2h-before reminder pushes past 50%; 2–3 reminders is the ceiling before fatigue

**Defer (v2+):**
- Drip content, certificates, video watermarking beyond the host's built-in
- Waitlist, package/bundle pricing, loyalty
- Multi-professional / staff agendas — explicit anti-feature for a solo operator
- Full DRM beyond the video host's bundled protection — Netflix-grade cost for a threat model that doesn't warrant it
- Affiliate/marketplace, gamification, BI dashboards, native mobile app

### Architecture Approach

A single deployable with clear internal module boundaries: identity, service catalog, availability/slot computation, booking, payments/webhooks, notifications, and courses. Slots are always computed on read from availability rules plus existing appointments — never pre-materialized, which avoids staleness when the schedule changes. Payments and webhooks are built once as shared infrastructure and consumed by both the booking side and the course side, routed by `external_reference`. This is what makes the course track a genuinely parallel workstream rather than a sequential add-on.

**Major components:**
1. **Identity** — two-tier but one underlying account model: phone-only lightweight identity for booking (no forced signup), upgradeable to a full account for students, reconciled by phone/email rather than duplicated
2. **Service catalog + availability rules** — the inputs to slot computation; must land before slot generation
3. **Slot computation** — pure on-read function deriving bookable slots from working hours, blocks, buffers, and per-service duration
4. **Booking core** — the appointment row itself is the hold: `status='awaiting_payment'` + `hold_expires_at`, with a DB-level `EXCLUDE USING gist` constraint on `(professional_id, tstzrange(starts_at, ends_at))` making overlap structurally impossible. No separate lock table, no distributed locks needed at this scale.
5. **Payments + webhooks (shared)** — one idempotent, signature-verified endpoint serving both booking deposits and course purchases
6. **Notifications** — WhatsApp send capability plus scheduled reminder dispatch that re-validates appointment state at send time
7. **Courses + student area** — catalog, enrollment grant, progress tracking, signed/expiring video URLs gated on enrollment

### Critical Pitfalls

1. **Double-booking under concurrent requests** — SELECT-then-INSERT overlap checks are a textbook TOCTOU race. Solve at the database layer with an `EXCLUDE` constraint (requires `btree_gist`), decided at schema-design time. Verify with an explicit concurrent-request test.
2. **Trusting the client redirect instead of the webhook** — the webhook is the only source of truth; the browser redirect is UX only. Verify HMAC signatures on every webhook, dedup insert-first on the provider's event id, and re-fetch authoritative status from the gateway API rather than trusting the payload's status field. Test that the webhook alone flips the appointment to confirmed with no frontend involvement.
3. **Confirming the appointment before funds clear** — use `awaiting_payment` with a 10–15 minute hold expiry; only a confirmed webhook promotes it to `confirmed`. Availability queries treat expired holds as free.
4. **Deposit forfeiture colliding with Brazilian consumer law** — CDC Art. 49 grants unconditional 7-day withdrawal for distance purchases (bookings *and* courses); Art. 51 II voids clauses eliminating refund rights. Implement a graduated policy in code (full refund well ahead, partial retention closer in, forfeiture only for same-day no-shows), disclosed before payment. This is legal interpretation, not legal advice — worth a consumer-law sanity check before launch.
5. **WhatsApp account ban via unofficial providers** — the burst-send pattern reminders require is precisely the documented ban trigger, with no appeal path, on the professional's only client channel. Use the official Cloud API. If an unofficial provider is ever used for a stopgap, it must be on a disposable number, never the primary business WhatsApp.
6. **Meta template rejection and the 24-hour window** — free-form messages are only permitted within 24h of the client's last inbound message. Bookings are typically made days before the reminder fires, so nearly every reminder needs a pre-approved template. Classify as "Utility" (cheaper, fewer rejections) not "Marketing", and submit for approval *before* reminder logic ships — review cycles can block the feature.
7. **Reminder-job incorrectness** — duplicate sends, sends after cancellation, sends at absurd hours. Persist `reminder_sent_at` markers, check-and-set atomically before sending, cancel pending reminders on cancel/reschedule, and compute send times in `America/Sao_Paulo`.
8. **LGPD baseline gaps** — applies fully to a solo/MEI operator. Collect only what each screen needs (booking: name + phone; courses: email), publish a privacy policy covering collection, purpose and retention, keep transactional WhatsApp consent distinct from marketing consent, and never store raw card data.
9. **Over-building for a team that doesn't exist** — no staff table, no professional-selector dropdown, no multi-tenancy. "Could add later" is not a reason to build now.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Identity
**Rationale:** Everything else depends on the identity model, and getting the dual-identity shape wrong (accidentally forcing login to book) would undermine the core value irreversibly.
**Delivers:** Project scaffold, database schema foundation, Better Auth with phone-lite booking identity plus full student accounts, and the bridge that reconciles a booking client who later becomes a student.
**Addresses:** Guest booking identity (table stakes)
**Avoids:** Forced-signup-to-book, which contradicts the core value

### Phase 2: Booking Core + Availability
**Rationale:** Service catalog must precede availability rules, which must precede slot computation — a hard dependency chain. The `EXCLUDE` constraint must land here because retrofitting it once real appointments exist is expensive.
**Delivers:** Service catalog CRUD with per-service duration/price, availability rules (hours, days off, blocks, buffers, lead time, horizon), on-read slot computation, and concurrency-safe booking creation with an `awaiting_payment` hold.
**Uses:** PostgreSQL `EXCLUDE USING gist` + `btree_gist`, Prisma raw SQL for the constraint
**Avoids:** Double-booking (Pitfall 1), premature slot confirmation (Pitfall 3)

### Phase 3: Payments + Webhook Infrastructure
**Rationale:** Payment is the confirmation gate for bookings, and it is shared infrastructure the course track also depends on. Building it once, early, unblocks both workstreams.
**Delivers:** Mercado Pago integration, Payment Bricks Pix UI, one signature-verified idempotent webhook endpoint routed by `external_reference`, the appointment state machine wired to payment events, and the graduated refund/cancellation policy.
**Uses:** Mercado Pago (0.99% Pix)
**Avoids:** Webhook trust and idempotency failures (Pitfall 2), CDC refund exposure (Pitfall 4)

### Phase 4: WhatsApp Integration + Reminders
**Rationale:** Depends on confirmed bookings existing. Template approval has external lead time, so the submission should start as early as this phase opens rather than at the end.
**Delivers:** Meta Cloud API integration, Business verification, approved Utility templates, booking confirmation message, 24h and day-of reminders, reminder state sync on reschedule/cancel, send-rate limiting and spend monitoring.
**Uses:** Meta WhatsApp Cloud API, date-fns-tz
**Avoids:** Account ban (Pitfall 5), template rejection and 24h-window failures (Pitfall 6), reminder duplication and mistimed sends (Pitfall 7)

### Phase 5: Courses + Student Area
**Rationale:** Depends only on Phases 1 and 3 (identity + payments), so it can run as a parallel workstream once those land rather than strictly after Phase 4.
**Delivers:** Course and lesson authoring, course purchase reusing the payment infrastructure, enrollment grant on confirmed payment, student area, per-lesson progress tracking, signed video URLs gated on enrollment, and the 7-day withdrawal refund flow.
**Uses:** Panda Video, Better Auth full accounts, shared webhook infrastructure
**Avoids:** CDC Art. 49 withdrawal exposure on course sales (Pitfall 4), LGPD gaps (Pitfall 8)

### Phase Ordering Rationale

- Identity comes first because both halves of the product depend on it and its shape is hard to change later
- Service catalog → availability → slot computation → booking is a strict dependency chain discovered in the architecture research
- Payments land before WhatsApp because payment confirms the booking, and the confirmation message is the first thing WhatsApp needs to send
- Payments are built once as shared infrastructure, which is what makes the course track parallelizable rather than sequential
- Courses depend only on identity + payments, so Phase 5 can overlap Phase 4 once Phase 3 completes — matching PROJECT.md's position that neither half is "extra"

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Mercado Pago API surface, webhook signature scheme, and current fee tiers shift regularly — re-verify at implementation start. Also confirm which account type (MEI vs CNPJ) applies, since tiers differ.
- **Phase 4:** Meta Business Manager verification timeline, current Brazil per-conversation pricing, and template rejection patterns all change; re-verify against Meta's live docs when the phase opens.
- **Phase 5:** Panda Video's current plan tiers and the bandwidth-cost threshold at which migrating to another host becomes worthwhile.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Better Auth setup and schema scaffolding are well-documented, established patterns.
- **Phase 2:** The `EXCLUDE` constraint and on-read slot computation are established patterns already documented in ARCHITECTURE.md; the only open input is confirming real service durations with the professional.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified against npm registry and official docs; Mercado Pago pick backed by fee pages fetched directly |
| Features | MEDIUM | Cross-checked against 8+ Brazilian competitors and Hotmart/Teachable norms; service durations are directional and need validation with the professional |
| Architecture | HIGH | `EXCLUDE` constraint, insert-first idempotency, and on-read slot computation are established patterns corroborated across independent sources |
| Pitfalls | MEDIUM | Engineering pitfalls rest on strong consensus; regulatory items (CDC, LGPD, WhatsApp bans) are grounded in statute, cited case law and incident reports but are **not legal advice** |

**Overall confidence:** MEDIUM-HIGH — high for technology and patterns, medium for Brazil-specific regulatory and provider particulars.

### Gaps to Address

- **CDC policy wording**: research provides the pattern, not legal advice — have the cancellation and refund terms reviewed by a consumer-law professional before launch
- **Lash service durations**: web-sourced and directional; confirm the real durations (especially manutenção) with the professional before hard-coding them as defaults
- **Deposit percentage and cancellation window**: Brazilian norms suggest 20–50% and a 24h free-cancel window, but validate against the professional's actual current practice
- **Meta approval timeline**: unknown and outside our control — start template submission at the opening of Phase 4, not the end, so it doesn't block the reminder feature
- **Video bandwidth cost curve**: establish the threshold at which the video host should be reconsidered

## Sources

### Primary (HIGH confidence)
- npm registry — current package versions for Next.js, Prisma, Better Auth
- Mercado Pago official pricing and developer documentation — Pix fees, Checkout Bricks, webhook handling
- Asaas official pricing page — fee comparison
- Meta WhatsApp Cloud API documentation — pricing model, template categories, 24-hour customer-service window
- PostgreSQL documentation — `EXCLUDE` constraints, `btree_gist`, range types
- Panda Video official pricing page — feature set confirmation

### Secondary (MEDIUM confidence)
- Brazilian salon-booking products (Trinks, DottoVip, Bellagenda, Agende-me, agendamento.link) — feature landscape via public marketing and help content
- Hotmart and Teachable help centers — course platform feature norms
- Brazilian salon-management blogs (4+ independent) — deposit and cancellation norms
- CDC Art. 49 and Art. 51 statute text plus cited TJDFT case law — withdrawal and refund rights
- Independent incident reports (Reclame Aqui, industry blogs) — unofficial WhatsApp provider ban patterns
- Cross-industry no-show reduction studies (largely healthcare) — reminder cadence effectiveness

### Tertiary (LOW confidence)
- Brazilian beauty blogs — lash technique durations; directional only, validate with the professional
- Video-hosting comparison aggregator — comparative DRM pricing across vendors, not sourced from each vendor's own current page

---
*Research completed: 2026-09-18*
*Ready for roadmap: yes*
