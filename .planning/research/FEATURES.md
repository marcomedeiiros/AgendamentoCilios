# Feature Research

**Domain:** Solo beauty-professional (lash designer) appointment booking with upfront deposit + online recorded-course sales with student area — Brazilian market
**Researched:** 2026-09-18
**Confidence:** MEDIUM (cross-checked across multiple BR-specific and global sources; no primary/official API docs consulted — see Sources)

## Feature Landscape

This domain has two halves that behave like two different products glued together by one operator and one login surface. Booking-for-solo-beauty-pro (Trinks, Booksy, DottoVip, Bellagenda, Agende-me, agendamento.link) is a mature, commoditized category in Brazil — the self-service-link + Pix-deposit + WhatsApp-reminder pattern is now the *default*, not a differentiator. Course/membership platforms (Hotmart, Kiwify, Eduzz, Teachable) are also mature, but this project explicitly rejects using them as the host (PROJECT.md: "a área de aluna é própria") — so the differentiator isn't features per se, it's *owning the two-sided identity model* (guest-like booking client vs. persistent-account student) inside one product.

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or clients bounce back to WhatsApp.

**Booking side (category codes: SERV, AVAIL, BOOK, PAY, NOTIF)**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Service catalog with per-service duration + price | Every BR competitor (Trinks, DottoVip, Bellagenda) leads with this; lash techniques (clássico, volume russo, híbrido, manutenção) have materially different durations (~2h, ~2h30-3h, ~2h, ~1-1.5h respectively) that directly drive slot math | LOW | SERV. Store duration in minutes per service; this is the seed value for AVAIL's slot generator |
| Self-service booking (client picks own slot, no approval step) | Core value prop of every competitor and explicitly required by PROJECT.md — approval-gated booking recreates the WhatsApp bottleneck | MEDIUM | BOOK. Requires real-time free/busy computation, not just a request form |
| Real, accurate availability (no double-booking) | Table stakes for literally any booking product; a double-booked slot is a trust-ending bug for a solo pro with no backup staff | MEDIUM-HIGH | AVAIL/BOOK. Must account for service duration + buffer atomically to prevent race conditions on concurrent bookings |
| Working-hours / days-off configuration | Every competitor lets the pro define weekly hours and mark exceptions (vacation, personal days) | LOW-MEDIUM | AVAIL |
| One-off blocks / manual holds | Pro needs to block ad-hoc time (doctor's appointment, personal event) without it looking "available" | LOW | AVAIL |
| Buffer/cleanup time between appointments | BR sources consistently cite 10-30 min between beauty appointments for cleanup/prep; without it, a 2h30 Volume Russo appointment bleeds into the next slot | LOW-MEDIUM | AVAIL. Model as buffer_minutes added after (sometimes before) each service, or baked into a padded slot length |
| Minimum notice / lead time | All scheduling tools (Calendly, every BR competitor) prevent booking minutes before start; protects the pro from unpreparable last-minute bookings | LOW | AVAIL |
| Booking horizon (how far out clients can book) | Prevents a client from booking a slot 2 years out that the pro's real calendar can't guarantee; standard Calendly-style feature | LOW | AVAIL |
| Upfront deposit (sinal) via Pix to confirm booking | This is the single most consistent feature across every BR competitor studied (DottoVip, Bellagenda, Agende-me, agendamento.link) and is explicitly required by PROJECT.md | MEDIUM-HIGH | PAY. Needs a Pix-capable payment gateway with webhook confirmation before the slot is truly "held" |
| Clear cancellation / no-show policy shown at booking | BR norm: 24h free-cancel window, deposit forfeited on late-cancel/no-show; legally grounded in Código Civil (arras) — must be visible, not just enforced silently | LOW | PAY/BOOK. This is a content/policy feature as much as a mechanic |
| Automatic confirmation on booking | Client needs certainty the slot is theirs the moment deposit clears — every competitor does this immediately | LOW | NOTIF |
| Automatic reminders (WhatsApp) | Evidence: a single 24h-out reminder cuts no-shows ~30%; every BR competitor markets WhatsApp reminders as a headline feature; PROJECT.md mandates WhatsApp over email | MEDIUM | NOTIF. See dedicated cadence guidance below — this is the single highest-leverage table-stakes feature for the stated goal (reduce no-shows) |
| Guest-style booking (name + phone, no forced account) | No BR competitor studied requires a full account to book a slot; global conversion data shows forced accounts cost 10-45% first-purchase conversion | LOW-MEDIUM | BOOK/CLIENT. Client record can still persist server-side (matched by phone) without exposing a login/password flow to the booking client |
| Pro-facing agenda view (day/week/month) with reschedule/cancel | Every competitor's "professional app" leads with this; the pro needs a command-center replacement for the paper notebook | MEDIUM | ADMIN |
| Service catalog management (CRUD) by the pro | Pro must be able to add/edit/retire services and adjust price/duration without a developer | LOW-MEDIUM | SERV/ADMIN |

**Course side (category codes: COURSE, STUDENT, PAY)**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Course purchase + payment (Pix + card) | Every Hotmart/Kiwify/Eduzz-trained BR buyer expects Pix at checkout; card is the fallback | MEDIUM | PAY. Same gateway concern as booking deposit — one gateway serving both flows is the efficient path |
| Student login / persistent account | Unlike booking, this MUST be a real account — long-lived access, resumable progress; this is the one place account-creation friction is justified | LOW-MEDIUM | STUDENT |
| Video lessons organized into modules/course structure | Every platform studied (Hotmart Club, Teachable) organizes content into modules → lessons; a flat unordered list feels broken | LOW-MEDIUM | COURSE |
| Progress tracking (what's been watched) | Explicitly required by PROJECT.md; Hotmart shows a literal progress bar per course; this is the #1 "am I making progress" signal for a self-paced buyer | MEDIUM | STUDENT. Needs per-lesson watched/completed state, not just "course opened" |
| Course/lesson authoring by the pro (CRUD) | Pro must publish and edit courses/lessons without developer involvement — explicitly required by PROJECT.md | MEDIUM | COURSE/ADMIN |
| Reasonable video hosting/streaming (not raw file download links) | Baseline expectation post-2020; raw downloadable MP4s invite trivial piracy and look unprofessional next to Hotmart/Kiwify-trained buyer expectations | MEDIUM | COURSE. Can start with a managed video host (Bunny Stream, Mux, Panda Video — all BR-friendly) rather than building a player |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable — and must tie back to Core Value ("resolve tudo sozinha pelo link").

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| One identity/login surface spanning both booking client and student | No competitor studied unifies "book a chair appointment" and "buy a recorded course" under one product; a client who becomes a student (or vice versa) has one relationship with the brand, not two disconnected logins on two different SaaS tools | MEDIUM-HIGH | This is the core differentiator implied by the project's own scope — worth calling out explicitly since it's easy to accidentally build as two silos |
| Deposit-and-duration-aware slot generation tuned to lash techniques specifically | Generic booking tools (Calendly, even Trinks) are technique-agnostic; a slot generator that already "knows" volume russo needs ~2h30 + buffer removes manual guesswork the pro currently does in her head | MEDIUM | Not novel per se (any tool with per-service duration does this) but doing it *well* for this specific vertical (correct default durations, sensible buffer defaults) is a real quality differentiator over generic tools |
| Automatic no-show/cancellation policy enforcement (not just stated policy) | BR sources show deposit *policies* are common, but automatic enforcement (auto-forfeit on no-show, auto-partial-refund on valid cancel) removes an awkward manual conversation the pro currently has to have herself | MEDIUM | PAY. Requires clear state machine: booked → confirmed → completed/no-show/cancelled, each with a deposit disposition rule |
| WhatsApp reminder cadence tuned for no-show reduction (not generic) | Evidence-based cadence (confirmation at booking + ~24-48h reminder + day-of nudge) outperforms single-reminder tools; most competitors advertise "WhatsApp reminders" but don't specify cadence — doing this deliberately and evidence-based is a differentiator | LOW-MEDIUM | NOTIF. Cheap to build once WhatsApp sending exists; the differentiation is in getting the *timing* right, not the channel |
| Post-service upsell path from client to student | A client who just got her lashes done is a warm lead for "learn to do this yourself" course content; no generic booking tool surfaces this, and no generic course platform knows who the pro's clients are | LOW-MEDIUM | Cross-sell surface (e.g., a "quer aprender?" nudge after a completed appointment) — pure product-composition advantage from owning both halves |
| Lightweight, low-friction identity bridge (guest client → optional student account) | Global data shows guest-first + optional-signup converts best; letting a booking-only client "graduate" into a student account later (reusing phone/email) reduces re-entry friction | MEDIUM | CLIENT/STUDENT. Needs a deliberate identity-merge strategy so the same person isn't two disconnected records |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems — specifically for a SOLO operator building v1.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Multi-professional / team scheduling | "What if I hire an assistant someday?" | Explicitly out of scope per PROJECT.md; adds real data-model complexity (staff calendars, service-to-staff assignment, permissions) for a need that doesn't exist yet | Design the service/availability model so a `professional_id` foreign key *could* be added later without a rewrite, but do not build the UI/logic for it now |
| Manual approval step before booking is confirmed | "I want to review before it's final" | This is explicitly the WhatsApp bottleneck the product exists to remove (PROJECT.md is unambiguous on this) | Deposit payment IS the confirmation gate — no human approval needed |
| Full DRM (Widevine/FairPlay) video protection | "Piracy is scary, I don't want my course stolen" | Full DRM is Netflix-grade infrastructure (~$49/mo+ managed hosts, real integration complexity) — wildly disproportionate for a solo creator's v1 catalog of a handful of courses | Use a managed video host with domain-locking, expiring/tokenized URLs, and simple per-user watermarking (email/IP overlay) — covers the realistic threat model at a fraction of the cost/complexity |
| Native mobile app | "Clients expect an app" | Explicitly out of scope per PROJECT.md (web-first); BR competitors' native apps are mostly *pro-facing* management tools, not something end clients install just to book one appointment | Mobile-responsive web booking page reached via link (WhatsApp, Instagram bio) — this is literally how every BR solo-pro competitor's client-facing flow already works |
| Course marketplace / affiliate program | "Hotmart/Kiwify have huge affiliate ecosystems, I could sell more" | Affiliate infrastructure (tracking, commission payout, marketplace discovery) is a massive feature surface irrelevant to a single-creator, single-product-line v1 | Direct sales via the pro's own link/socials; revisit only if course sales volume justifies it |
| Gamification (badges, points, leaderboards) in student area | Hotmart Club offers it, "feels modern" | Adds engagement-system complexity with no validated need — this project's course scope is small (recorded lash courses for a handful of students), not a mass cohort-based academy | Simple, honest progress bar (% of lessons watched) is enough signal; PROJECT.md only requires progress tracking, not gamification |
| Real-time chat / in-app messaging between client and pro | "Replaces WhatsApp conversations" | Directly conflicts with the stated goal of moving *away* from WhatsApp-as-the-interface for booking; also a large surface (notifications, read receipts, moderation) for a solo operator | WhatsApp remains the *notification/reminder* channel (one-way, templated), not a two-way in-app chat feature |
| Multiple/dynamic pricing tiers, packages, subscriptions for services | "Could increase revenue" | Not requested in PROJECT.md; adds pricing-engine complexity (bundles, credits, expiry rules) before the core single-service-single-price flow is even validated | Ship flat per-service pricing first; packages are a v1.x consideration only if demand is validated |
| Waitlist / overbooking queue for fully-booked slots | "Captures demand I'd otherwise lose" | Real feature in mature booking tools, but adds a notification-and-priority subsystem before the core booking flow has even been validated with real users | Defer to v1.x; a full calendar with no waitlist is a normal, complete v1 experience |
| Built-in accounting / financial reporting (Trinks-style 130+ reports) | "Trinks/Belasis have rich financial dashboards" | This is a feature built for salon *owners managing staff economics* (commissions, multi-chair P&L) — irrelevant to a solo operator who is both the seller and the only cost center | A simple "upcoming bookings + payments received" view is sufficient; defer BI/reporting entirely |

## Feature Dependencies

```
[SERV: Service catalog w/ duration+price]
    └──requires──> [AVAIL: Slot generator]
                       └──requires──> [BOOK: Self-service booking flow]
                                          └──requires──> [PAY: Deposit payment via Pix]
                                                             └──enables──> [NOTIF: Confirmation message]
                                                             └──enables──> [PAY: No-show/cancellation policy enforcement]

[AVAIL: Working hours + days off + blocks]
    └──requires──> [AVAIL: Slot generator]

[AVAIL: Buffer/cleanup time]
    └──enhances──> [AVAIL: Slot generator]  (padding, not a hard dependency)

[AVAIL: Minimum notice + booking horizon]
    └──enhances──> [AVAIL: Slot generator]  (filters, not a hard dependency)

[BOOK: Confirmed booking]
    └──requires──> [NOTIF: Reminder cadence]

[CLIENT: Guest-style identity]
    └──enables──> [BOOK: Self-service booking flow]  (booking must not block on account creation)

[STUDENT: Persistent account]
    └──requires──> [PAY: Course purchase]
    └──requires──> [COURSE: Course/lesson catalog]
                       └──enables──> [STUDENT: Progress tracking]

[CLIENT: Guest identity] ──can merge into──> [STUDENT: Persistent account]  (identity-bridge differentiator)

[BOOK: Manual approval step] ──conflicts──> [BOOK: Self-service booking flow]  (anti-feature vs. core value)
[COURSE: Full DRM] ──conflicts──> [Solo-operator v1 budget/complexity constraint]
```

### Dependency Notes

- **AVAIL (slot generator) requires SERV (duration data):** you cannot compute a free/busy slot without knowing how long each service occupies the calendar — this makes the service catalog a hard prerequisite for any availability work, and must land in an earlier phase.
- **BOOK requires PAY to be "confirmed", not just "requested":** because approval-by-the-pro is explicitly an anti-feature, the deposit payment webhook becomes the *only* gate that turns a hold into a confirmed booking — this makes payment integration a earlier-phase dependency, not a late add-on.
- **NOTIF (reminders) requires a confirmed BOOK record with a timestamp:** the reminder cadence (confirmation, ~24-48h out, day-of) needs a scheduled-job/cron capability keyed off the appointment time, so this is naturally sequenced after booking exists.
- **CLIENT (guest identity) enables BOOK but must not block it:** if guest identity isn't designed first, the natural failure mode is defaulting to "require login to book" which directly undermines the self-service core value — this dependency should be called out explicitly in requirements, not left implicit.
- **STUDENT depends on both PAY and COURSE existing:** a student account with nothing purchased and no course structure to track progress against has no purpose — course catalog and payment should land before/alongside student-area progress tracking.
- **The CLIENT→STUDENT identity bridge is optional and low-priority relative to the above:** it's a differentiator, not a dependency any table-stakes feature needs — safe to defer to v1.x without blocking anything else.

## MVP Definition

### Launch With (v1)

Minimum viable product — matches PROJECT.md's "Active" requirements almost 1:1; nothing here is optional.

- [ ] Service catalog with duration + price per lash technique (SERV) — no slot math is possible without it
- [ ] Availability configuration: working hours, days off, one-off blocks (AVAIL) — pro must be able to define when she's bookable at all
- [ ] Buffer time between appointments (AVAIL) — prevents back-to-back bookings that ignore cleanup/prep reality
- [ ] Minimum notice + booking horizon (AVAIL) — prevents unworkable last-second or far-future bookings
- [ ] Self-service booking flow with guest-style client identity (BOOK/CLIENT) — the core value proposition itself
- [ ] Pix deposit payment to confirm booking (PAY) — the no-show mitigation the project exists to add
- [ ] Visible cancellation/no-show policy + automatic enforcement of deposit disposition (PAY) — closes the loop the deposit opens
- [ ] Automatic WhatsApp confirmation + reminder cadence (NOTIF) — the second no-show mitigation, evidence shows this materially reduces no-shows
- [ ] Pro-facing agenda (view/reschedule/cancel) (ADMIN) — replaces the paper notebook
- [ ] Course purchase + Pix/card payment (PAY/COURSE) — required, non-optional per PROJECT.md
- [ ] Student account with login (STUDENT) — required for persistent course access
- [ ] Course/lesson authoring by the pro (COURSE/ADMIN) — required, pro must self-serve publishing
- [ ] Video lessons with basic streaming (not raw downloads) + per-lesson progress tracking (COURSE/STUDENT) — required per PROJECT.md

### Add After Validation (v1.x)

Features to add once core is working and real usage data exists.

- [ ] CLIENT→STUDENT identity bridge — add once there's evidence clients are also becoming students (or vice versa)
- [ ] Drip content / scheduled lesson release — add if a course is large/cohort-like enough that pacing matters; not needed for a small initial course catalog
- [ ] Certificates of completion — nice trust signal for course graduates once the catalog has real completions to certify
- [ ] Per-user watermarking on video — add once course sales volume makes piracy a real (not theoretical) risk
- [ ] Waitlist for fully booked slots — add once real demand data shows slots are consistently maxed out
- [ ] Package/bundle pricing for services — add if clients start asking for multi-session deals

### Future Consideration (v2+)

Features to defer until product-market fit is established, or that may never be needed for a solo operator.

- [ ] Multi-professional support — only if the business model changes to hiring staff
- [ ] Full DRM video protection — only if piracy becomes a demonstrated, material problem
- [ ] Affiliate/marketplace program for courses — only if course sales scale beyond direct-link sales
- [ ] Gamification in student area — only if engagement data shows students disengage without it
- [ ] Financial reporting/BI dashboards — only if the business grows complex enough to need more than "who paid, who's booked"
- [ ] Native mobile app — only if web usage data shows a real gap that a wrapped web app can't close

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Service catalog (duration+price) | HIGH | LOW | P1 |
| Availability (hours/days off/blocks) | HIGH | MEDIUM | P1 |
| Buffer/cleanup time | MEDIUM | LOW | P1 |
| Minimum notice + booking horizon | MEDIUM | LOW | P1 |
| Self-service booking flow | HIGH | MEDIUM | P1 |
| Guest-style client identity | HIGH | LOW-MEDIUM | P1 |
| Pix deposit payment | HIGH | MEDIUM-HIGH | P1 |
| Cancellation/no-show policy enforcement | HIGH | MEDIUM | P1 |
| WhatsApp confirmation + reminders | HIGH | MEDIUM | P1 |
| Pro-facing agenda management | HIGH | MEDIUM | P1 |
| Course purchase (Pix/card) | HIGH | MEDIUM | P1 |
| Student login/account | HIGH | LOW-MEDIUM | P1 |
| Course/lesson authoring | HIGH | MEDIUM | P1 |
| Video hosting + progress tracking | HIGH | MEDIUM | P1 |
| CLIENT→STUDENT identity bridge | MEDIUM | MEDIUM-HIGH | P2 |
| Evidence-based reminder cadence tuning | MEDIUM | LOW | P2 |
| Drip content scheduling | LOW-MEDIUM | LOW-MEDIUM | P2 |
| Certificates of completion | LOW-MEDIUM | LOW | P2 |
| Basic watermarking on video | LOW-MEDIUM | LOW-MEDIUM | P2 |
| Waitlist for full slots | LOW | MEDIUM | P3 |
| Package/bundle pricing | LOW | MEDIUM | P3 |
| Multi-professional support | LOW (today) | HIGH | P3 |
| Full DRM | LOW | HIGH | P3 |
| Affiliate/marketplace | LOW | HIGH | P3 |
| Gamification | LOW | MEDIUM | P3 |
| Financial reporting/BI | LOW | MEDIUM-HIGH | P3 |
| Native mobile app | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Trinks (BR, salon-oriented) | DottoVip / Bellagenda / Agende-me (BR, solo-oriented) | Our Approach |
|---------|------------------------------|--------------------------------------------------------|--------------|
| Self-service booking | Yes, client books online | Yes, 24h client self-booking via link | Match this — it's the category baseline |
| Deposit collection | Not headline feature (more staff/commission focus) | Yes, Pix deposit at booking is the headline feature | Match and make it the confirmation gate (no manual approval) |
| WhatsApp reminders | Yes, automatic | Yes, automatic, customizable send times | Match, tune cadence using evidence (24-48h + day-of) |
| Financial reporting | Extensive (130+ reports, commissions) | Minimal/basic | Skip — anti-feature for solo operator (see Anti-Features) |
| Multi-professional support | Core use case | Not the focus (solo tier priced separately, ~R$59.90 vs ~R$99.90 for teams) | Skip — explicitly out of scope per PROJECT.md |
| Course/student area | Not offered | Not offered | This is where our product diverges entirely — no BR booking competitor studied offers this |

| Feature | Hotmart Club | Teachable | Our Approach |
|---------|--------------|-----------|--------------|
| Progress tracking | Progress bar, % of lessons watched | Watch-percent compliance rules | Match with a simple per-lesson watched/completed flag + overall % |
| Drip content | Configurable (days-after or fixed date) | Same pattern | Defer to v1.x — small initial catalog doesn't need pacing yet |
| Certificates | Auto-issued at 100% completion | Auto-issued at completion | Defer to v1.x — nice trust signal, not core to "acompanha progresso" requirement |
| Video protection | Standard hosted player (no DRM claims found) | Standard hosted player | Use managed video host with domain-lock + watermark, not full DRM |
| External platform dependency | This IS the platform (Hotmart hosts everything) | This IS the platform (Teachable hosts everything) | Explicitly rejected per PROJECT.md — área de aluna is proprietary, not outsourced |

## Sources

- [Booksy Biz — No-Show Protection](https://biz.booksy.com/en-us/features/no-show-protection) — MEDIUM confidence
- [Booksy Biz — reduce no-shows and cancellations](https://biz.booksy.com/en-us/blog/use-booksy-to-reduce-no-shows-and-cancellations) — MEDIUM confidence
- [Trinks — Sistema para Salão de Beleza](https://negocios.trinks.com/negocios/saloes-de-beleza/) — MEDIUM confidence
- [Trinks — Rotina de mensagens WhatsApp](https://trinks.com/programa-para-salao/divulgacao) — MEDIUM confidence
- [DottoVip — Gestor Lash e Agenda](https://dottovip.com/lash-designers) — MEDIUM confidence
- [Bellagenda — Agenda para Lash Designer](https://bellagenda.com.br/agenda-para-lash-designer) — MEDIUM confidence
- [Agende-me — Sistema de Agendamento para Lash Designer](https://agende-me.com/lash-designer/) — MEDIUM confidence
- [agendamento.link — Lash Designer](https://agendamento.link/lash-designer/) — MEDIUM confidence
- [Calendly Help — how to use buffers](https://calendly.com/help/how-to-use-buffers) — MEDIUM confidence
- [Calendly Help — fine-tune availability settings](https://calendly.com/help/how-to-fine-tune-your-availability-settings) — MEDIUM confidence
- [Calendly Community — minimum notice / date range](https://community.calendly.com/how-do-i-40/minimum-amount-of-hours-before-booking-available-for-others-5352) — MEDIUM confidence
- [Solutionreach — Appointment Reminder Cadence Guide](https://www.solutionreach.com/guide/three-is-a-magic-number) — MEDIUM confidence
- [Curogram — appointment reminder psychology / timing](https://curogram.com/blog/best-practices/appointment-management/best-time-send-appointment-reminder) — MEDIUM confidence
- [Belasis — Guia Prático para Cobrança de Sinal](https://www.belasis.com.br/guia-pratico-para-cobranca-de-sinal) — MEDIUM confidence
- [Blog Trinks — Política de Cancelamento para Salão](https://blog.trinks.com/politica-de-cancelamento-para-salao-de-beleza/) — MEDIUM confidence
- [Fenvix — Política de cancelamento sem perder clientes](https://www.fenvix.com.br/blog/politica-cancelamento-salao-de-beleza) — MEDIUM confidence
- [Graces — Como pedir sinal para o cliente](https://graces.com.br/blog/atendimento/pedir-sinal-para-o-cliente-no-salao-de-beleza/) — MEDIUM confidence
- [Hotmart — Como configurar prazo de liberação de conteúdos](https://help.hotmart.com/pt-br/article/213467588/como-configurar-o-prazo-de-liberacao-e-duracao-de-conteudos-no-hotmart-club-) — MEDIUM confidence
- [Hotmart — Como configurar um certificado](https://help.hotmart.com/pt-br/article/115003666771/como-configurar-um-certificado-para-o-meu-curso-) — MEDIUM confidence
- [Hotmart Club — tudo sobre área de membros](https://help.hotmart.com/pt-br/article/20060658355085/hotmart-club-tudo-o-que-voce-precisa-saber-sobre-a-area-de-membros-da-hotmart) — MEDIUM confidence
- [EngagED — Alternativas à Hotmart em 2026](https://engaged.com.br/blog/alternativas-a-hotmart/) — MEDIUM confidence
- [CrazyStack — Hotmart vs Kiwify vs Eduzz comparativo](https://www.crazystack.com.br/2026/hotmart-vs-kiwify-vs-eduzz-comparativo) — MEDIUM confidence
- [Teachable Course Features](https://support.teachable.com/hc/en-us/sections/19529004698125-Course-Features) — MEDIUM confidence
- [Gumlet — How Course Creators Can Protect Their Videos in 2026](https://www.gumlet.com/learn/how-creators-can-protect-videos/) — MEDIUM confidence
- [Kinescope — How to Protect Online Course Videos from Piracy](https://www.kinescope.com/blog/how-to-protect-online-course-videos-from-piracy) — MEDIUM confidence
- [Corbado — Guest Checkout vs. Forced Login](https://www.corbado.com/blog/guest-checkout-vs-forced-login) — MEDIUM confidence
- [Cartylabs — Guest Checkout vs. Account Creation on Shopify](https://cartylabs.com/blog/guest-checkout-vs-account-creation-shopify/) — MEDIUM confidence
- [João Da Beleza — Cílios Fio a Fio x Volume Russo](https://joaodabeleza.com.br/blogs/blog-extensao-de-cilios/cilios-fio-a-fio-e-volume-russo) — MEDIUM confidence
- [Amo Cílios — tempo de aplicação Volume Russo](https://amocilios.com.br/quanto-tempo-demora-a-aplicacao-do-alongamento-de-cilios-volume-russo/) — MEDIUM confidence
- [Studio Luana Santos — quanto tempo dura a extensão de cílios](https://studioluanasantos.com.br/blog/extensao-cilios-quanto-dura) — MEDIUM confidence
- [Hoje em Dia — intervalo entre clientes e limpeza (salões, BH)](https://www.hojeemdia.com.br/minas/intervalo-entre-clientes-e-limpeza-constante-veja-regras-para-sal%C3%B5es-de-beleza-reabrirem-em-bh-1.788065) — MEDIUM confidence
- [Blog Belio — Como Organizar a Agenda do Salão de Beleza](https://blog.belio.com.br/artigos/como-organizar-agenda-salao-beleza/) — MEDIUM confidence

All findings above were gathered via general web search (no official product documentation/API access was used for this dimension) and cross-checked against 2+ independent sources per claim, which raises them from the default LOW web-search tier to MEDIUM per this project's confidence classification. Treat exact percentages/durations as directional, not contractual — validate specific numbers (deposit %, exact service durations) with the actual professional (domain expert) before hard-coding them as product defaults.

---
*Feature research for: Solo beauty-professional booking + online course platform (Brazilian market)*
*Researched: 2026-09-18*
