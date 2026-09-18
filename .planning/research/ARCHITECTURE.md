# Architecture Research

**Domain:** Solo-professional appointment booking (with deposit payments + WhatsApp reminders) + recorded-course platform with student area — Brazilian market
**Researched:** 2026-09-18
**Confidence:** HIGH (concurrency/state-machine/webhook patterns — established engineering practice, cross-checked); MEDIUM (Brazil-specific provider details — WhatsApp API tiers, gateway idiosyncrasies — verify further during stack-specific implementation)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │ Public booking  │  │ Student area   │  │ Professional admin console │ │
│  │ flow (guest-ish)│  │ (authenticated)│  │ (agenda, catalog, courses) │ │
│  └────────┬────────┘  └────────┬───────┘  └───────────┬────────────────┘ │
├───────────┴────────────────────┴──────────────────────┴──────────────────┤
│                          APPLICATION / API LAYER                          │
│  ┌───────────┐ ┌────────────┐ ┌───────────┐ ┌───────────┐ ┌────────────┐│
│  │ Identity  │ │ Availability│ │ Booking   │ │ Payments  │ │ Courses /  ││
│  │ & Auth    │ │ & Slots     │ │ Lifecycle │ │ & Webhooks│ │ Enrollment ││
│  └───────────┘ └────────────┘ └───────────┘ └───────────┘ └────────────┘│
│  ┌───────────────────────────┐ ┌──────────────────────────────────────┐ │
│  │ Reminder / Notification    │ │ Video Access Grant (signed URLs)     │ │
│  │ Scheduler (WhatsApp)       │ │                                      │ │
│  └───────────────────────────┘ └──────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                          DATA / QUEUE LAYER                               │
│  ┌────────────┐  ┌──────────────────┐  ┌───────────────────────────┐    │
│  │ PostgreSQL │  │ Jobs table / Redis│  │ Object storage / video    │    │
│  │ (system of │  │ queue (reminders, │  │ host (course assets)      │    │
│  │  record)   │  │  webhook retries) │  │                            │    │
│  └────────────┘  └──────────────────┘  └───────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────────┤
│                          EXTERNAL SERVICES                                │
│  Payment gateway (Pix)   │   WhatsApp Business API   │  Video host (CDN) │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| Identity & Auth | Lightweight phone-based identity for booking clients; full email/password (or magic link) for students; unifies a person across both when the same phone/email appears twice | Single `accounts`/`people` table with nullable auth fields, upgraded in place rather than duplicated |
| Availability & Slots | Turns working hours + blocks + service duration + buffers into a list of bookable start times for a given date | Pure application-layer function, computed on read, not pre-materialized |
| Booking Lifecycle | Owns the appointment state machine (awaiting_payment → confirmed → completed/cancelled/no_show/expired); enforces "no two overlapping appointments for one professional" | PostgreSQL row + `EXCLUDE` constraint on a time-range column, application-layer state transitions |
| Payments & Webhooks | Creates Pix charges (deposit or course), receives and verifies gateway webhooks, deduplicates events, drives state transitions for both booking and course purchase | Single shared webhook endpoint + `webhook_events` idempotency table + `external_reference` routing |
| Reminder / Notification Scheduler | Schedules the 24h-before WhatsApp send per appointment, keeps it correct across reschedule/cancel, sends confirmation on booking | Row-per-reminder table + periodic poller (or delayed queue job); re-validates appointment state at send time |
| Courses / Enrollment | Owns course/lesson catalog, purchase → enrollment grant, progress tracking | Enrollment row gated strictly by confirmed payment; progress tracked server-side via heartbeat |
| Video Access Grant | Mints short-lived signed playback URLs only for enrolled + paid students | App-level enrollment check + edge-level signed URL/token from video host |

## Recommended Project Structure

```
server/
├── modules/
│   ├── identity/          # accounts, auth (phone-lite + email/password), session
│   ├── catalog/           # services, courses, lessons (professional-authored content)
│   ├── availability/      # working hours, blocks, slot computation (pure logic, unit-testable)
│   ├── booking/           # appointment state machine, hold/expiry, reschedule/cancel
│   ├── payments/          # gateway client, webhook endpoint, webhook_events idempotency store
│   ├── notifications/     # WhatsApp client, reminder scheduling/poller, message templates
│   ├── courses/           # enrollment, progress tracking, signed-URL minting
│   └── shared/            # db client, time/timezone helpers, job runner
├── jobs/                  # scheduled workers: hold-expiry sweep, reminder dispatcher, webhook-retry drain
└── db/
    └── migrations/        # includes btree_gist extension + EXCLUDE constraint migration

client/
├── booking/                # public, low-friction flow (service → slot → deposit)
├── student-area/           # authenticated: course library, player, progress
└── admin/                  # professional-only: agenda, availability editor, course authoring
```

### Structure Rationale

- **`availability/` isolated from `booking/`:** slot computation is pure and needs to be unit-tested exhaustively (durations, buffers, DST-free timezone edge cases) without touching the DB or payment flow.
- **`payments/` is shared infrastructure, not owned by either booking or courses:** both consumers create a charge and receive a webhook through the same module; this is what step 5 of the build order formalizes — build it once, generically.
- **`notifications/` separate from `booking/`:** reminder correctness under reschedule/cancel is its own hard problem (see Q4) and benefits from being testable independent of the booking state machine that triggers it.
- **Client split by trust level (public / student / admin):** matches the three very different auth postures (guest-ish, persistent student, professional operator) rather than by technical layer.

## Architectural Patterns

### Pattern 1: Slot computation as a pure, on-read function (not pre-materialized slots)

**What:** Never store a row per bookable slot. Store working-hour rules, blocks, and existing appointments; derive the list of open start times for a requested date at request time.
**When to use:** Any single-provider or small-team booking system where the schedule changes often (blocks, cancellations) — pre-materialized slot tables go stale immediately and require invalidation logic that duplicates the derivation logic anyway.
**Trade-offs:** Slightly more CPU per availability query (negligible at this scale — one professional, dozens of appointments/day) in exchange for zero staleness and one source of truth.

**Example:**
```typescript
function computeOpenSlots(date: LocalDate, service: Service, rules: WorkingHourRule[], blocks: Block[], existing: Appointment[]): TimeRange[] {
  const workWindows = applyRulesAndBlocks(date, rules, blocks); // in America/Sao_Paulo civil time
  const busy = existing.map(a => expandWithBuffers(a, service.bufferBefore, service.bufferAfter));
  const free = subtractRanges(workWindows, busy);
  return sliceIntoCandidateStarts(free, service.durationMinutes, GRANULARITY_MINUTES);
}
```

### Pattern 2: Database-enforced double-booking prevention via range EXCLUDE constraint

**What:** Instead of relying on application-level checks ("query for conflicts, then insert"), which race under concurrency, push the invariant into PostgreSQL itself with an `EXCLUDE` constraint over a time-range column, using the `btree_gist` extension.
**When to use:** Any booking system where two concurrent requests could target the same or overlapping resource-time. This is the concrete answer to "two clients grabbing the same slot."
**Trade-offs:** Requires `btree_gist` (available on any standard Postgres, including managed offerings like Supabase/RDS/Neon); the failure mode surfaces as a Postgres exception (`23P01`) that the app must catch and turn into a friendly "esse horário acabou de ser reservado, escolha outro" — this is a feature (deterministic reject at the DB layer), not a hack.

**Example:**
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
  ADD CONSTRAINT no_overlapping_appointments
  EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status IN ('awaiting_payment', 'confirmed'));
```
```typescript
try {
  await db.insert('appointments', { professional_id, starts_at, ends_at, status: 'awaiting_payment', hold_expires_at });
} catch (e) {
  if (isExclusionViolation(e)) return conflict('SLOT_TAKEN');
  throw e;
}
```
`starts_at`/`ends_at` already include the service's buffer-before/buffer-after so the constraint enforces buffers for free. No advisory locks, no Redis distributed lock, no `SELECT ... FOR UPDATE` discipline to remember on every code path — the constraint is unconditional and lives at the data layer, immune to application bugs. This is the correct scale-appropriate choice here; `SELECT FOR UPDATE`-based two-phase locking is the right tool for fixed pre-existing rows (e.g., a fixed seat count) but is the wrong shape for arbitrary variable-duration time ranges.

### Pattern 3: Insert-first webhook idempotency

**What:** On webhook receipt, verify signature, then attempt to INSERT the event id into a dedupe table before doing any side effects. If the insert violates a unique constraint, the event was already processed — return 200 immediately, do nothing else.
**When to use:** Any payment webhook (Pix deposit or course purchase) from any gateway that retries on non-2xx or on timeout — which is all of them.
**Trade-offs:** Requires one small table (`webhook_events`) but eliminates an entire class of double-processing bugs (double-confirming a booking, double-granting enrollment) that a "check status, then update" approach cannot fully close under concurrent retries.

**Example:**
```sql
CREATE TABLE webhook_events (
  provider text NOT NULL,
  event_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, event_id)
);
```
```typescript
async function handleWebhook(req) {
  if (!verifySignature(req)) return res.status(401).end();
  const { provider, eventId } = extractIds(req);
  const inserted = await tryInsertEvent(provider, eventId); // false on conflict
  if (!inserted) return res.status(200).end(); // already handled, no-op
  // Do NOT trust req.body's status field — re-fetch current state from the gateway API.
  const payment = await gateway.getPayment(extractPaymentId(req));
  await enqueue('process-payment-event', { provider, paymentId: payment.id, status: payment.status });
  return res.status(200).end(); // ack fast; heavy work happens async in the queued job
}
```

## Data Flow

### Booking + deposit flow

```
Client picks service+date
    ↓
GET /availability → Availability module computes open slots (reads appointments + rules)
    ↓
Client picks slot → POST /bookings
    ↓
Booking module: INSERT appointment(status=awaiting_payment, hold_expires_at=now()+15min)
    │  (EXCLUDE constraint rejects overlap → 409 SLOT_TAKEN, client retries with fresh list)
    ↓ success
Payments module: create Pix charge, external_reference = "booking:{id}"
    ↓
Client pays via Pix (outside the system, in their bank app)
    ↓
Gateway → Webhook endpoint (signature verify → idempotency insert → re-fetch payment status)
    ↓
Booking module: transition awaiting_payment → confirmed (only if status still awaiting_payment)
    ↓
Notifications module: send WhatsApp confirmation now; schedule reminder row at starts_at - 24h
```

### Course purchase + video access flow

```
Student browses catalog → POST /course-purchases
    ↓
Payments module: create Pix charge, external_reference = "course_purchase:{id}"
    ↓
(same shared webhook endpoint as booking — routed by external_reference prefix)
    ↓
Courses module: on confirmed payment → INSERT enrollment(student_id, course_id)
    ↓
Student opens lesson → app checks enrollment → mints short-lived signed video URL from video host
    ↓
Player streams via signed URL (edge-enforced expiry) → periodic progress heartbeat → lesson_progress row
```

### Reminder dispatch flow (and how it stays correct under reschedule/cancel)

```
Appointment confirmed → INSERT reminder(appointment_id, send_at=starts_at-24h, status=pending)
    ↓
Appointment rescheduled → UPDATE reminder.send_at to new time (or delete+recreate);
                            if new starts_at is <24h away, skip/replace with an immediate notice
Appointment cancelled   → UPDATE reminder.status = cancelled
    ↓
Poller (every few minutes) selects reminder WHERE status=pending AND send_at <= now()
    ↓
Before sending: re-fetch the appointment's *current* status/starts_at (never trust the queued snapshot)
    ↓
If still confirmed and time matches → send WhatsApp → atomically UPDATE ... WHERE status='pending' → status=sent
    (guards against two poller instances picking up the same row)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|---------------------------|
| Single professional, current scale (v1) | Monolith server + PostgreSQL + a lightweight DB-polled jobs table for reminders/webhook retries is sufficient. No Redis/queue broker needed — volume is dozens of appointments/day, not thousands. |
| Multiple professionals / small team (explicitly out of scope for v1, but worth architecting for) | `professional_id` is already a first-class column on availability rules and appointments (not assumed-singleton), so adding professionals later is a data change, not a schema rewrite — as long as this discipline is kept from day one. |
| High course-purchase volume / viral spike | Video delivery is already offloaded to a CDN/video host (not the app server), so this scales independently; the app server's job is only "check enrollment, mint a token," which is cheap. |

### Scaling Priorities

1. **First likely pressure point:** WhatsApp send throughput/cost (Meta charges per conversation and requires approved templates) if course marketing campaigns are ever added — not a concern for pure booking reminders at this volume, but keep the notifications module provider-agnostic so switching or adding a second WhatsApp provider doesn't touch booking/courses code.
2. **Second, much later:** if a second professional is added, the availability slot computation still works unchanged per-professional; the only new work is professional-selection UI and per-professional working-hour rules, both already modeled as first-class.

## Anti-Patterns

### Anti-Pattern 1: Pre-generating and storing every bookable slot as a row

**What people do:** A nightly/on-demand job writes one row per 30-minute slot per day into a `slots` table, and booking just marks a row `taken`.
**Why it's wrong:** Every schedule change (professional adds a block, changes hours, a service's duration changes) requires regenerating or patching a combinatorial set of rows; it's easy for this to drift out of sync with the real rules, and it doesn't naturally express variable-duration services or buffers without exploding row counts.
**Do this instead:** Compute slots on read from rules + existing appointments (Pattern 1). Only the appointment itself is a persisted row.

### Anti-Pattern 2: Checking for conflicts in application code before inserting

**What people do:** `SELECT * FROM appointments WHERE professional_id=? AND overlaps(...)`, and if empty, `INSERT`.
**Why it's wrong:** This is exactly the race the question calls out — two requests can both run the SELECT before either INSERT commits, and both see "free." This bug is intermittent and load-dependent, so it often survives testing and appears in production under real concurrent traffic (e.g., a promo pushed on WhatsApp status).
**Do this instead:** Let the database reject the second insert via the `EXCLUDE` constraint (Pattern 2); treat the app-side pre-check (if kept at all) as a UX optimization only, never as the source of truth.

### Anti-Pattern 3: Trusting the webhook payload's status field as the source of truth

**What people do:** Read `payload.status === 'approved'` directly from the webhook body and update the appointment/enrollment based on it.
**Why it's wrong:** Gateways (including Mercado Pago, per their own documentation) treat the webhook as a "something changed, go check" ping — delivery can be delayed, retried, or arrive out of order relative to the true current state. Acting on a stale payload can incorrectly confirm a booking that was actually later cancelled/refunded, or vice versa.
**Do this instead:** Use the webhook only to trigger a fetch of the authoritative current payment status via the gateway's API, and drive state transitions off that (Pattern 3).

### Anti-Pattern 4: Forcing full account creation before a client can book

**What people do:** Require email + password signup as a gate before the booking flow, "to keep it consistent with the course platform's auth."
**Why it's wrong:** Directly contradicts the product's stated core value (self-service without WhatsApp-level friction) and the explicit constraint that booking clients should not be forced into a full account just to book a service.
**Do this instead:** Phone-based lightweight identity for booking (Q6); allow upgrading to a full account only when/if the same person buys a course.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|----------------------|-------|
| Payment gateway (Pix) — e.g. Mercado Pago, Asaas, Pagar.me | Server creates charge with `external_reference`, receives webhook at one shared endpoint, verifies HMAC signature, re-fetches authoritative status via API | Choice of specific gateway is a STACK.md decision (fees, Pix settlement speed, split-payment needs); the webhook-handling pattern above applies to any of them |
| WhatsApp Business API (Meta Cloud API or a BSP) | Server sends pre-approved "utility" template messages (booking confirmation, 24h reminder); receives delivery/read-status and optional button-tap webhooks at a separate endpoint from payments | Automated reminders must use an approved template, classified as a utility message, not marketing — affects Meta's approval and per-conversation billing |
| Video host (e.g., Bunny Stream, Cloudflare Stream, or self-hosted S3+CloudFront signed URLs) | App mints short-lived signed playback token per lesson view, gated by an enrollment check | A purpose-built video host with built-in signed tokens is architecturally simpler than assembling raw S3+CloudFront+HLS+Key Groups for a small catalog; keep the "app checks enrollment, then asks video host for a token" boundary regardless of provider chosen |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|----------------|-------|
| Availability ↔ Booking | Direct function call (same process) | Availability is read-only/pure; Booking is the only writer of appointment rows |
| Booking ↔ Payments | Booking creates a charge request and later reacts to a status-changed event from Payments (in-process event/callback, or a queued job) | Payments module has no knowledge of booking-specific business rules — it only knows "charge X changed to status Y for external_reference Z" |
| Payments ↔ Courses | Same shared webhook pipeline as Booking, routed by `external_reference` prefix | Keeps webhook signature verification and idempotency logic in exactly one place |
| Booking ↔ Notifications | Booking emits state-change events (confirmed, rescheduled, cancelled); Notifications owns all reminder scheduling logic and re-validates state at send time | Prevents booking module from needing to know anything about WhatsApp; prevents stale-reminder bugs by centralizing the "is this still true" check in one place |
| Courses ↔ Video host | Courses module mints tokens on demand per view request; never stores or exposes a long-lived direct video URL to the client | The signed-URL expiry is the actual enforcement point, not just the app's own auth check |

## Suggested Build Order

Dependency-driven, not calendar-driven — this is meant to inform roadmap phase sequencing, not literal implementation days:

1. **Identity foundation** — lightweight phone-based accounts + full email/password accounts, with the "same person, upgraded" model. Everything else depends on "who is this."
2. **Service catalog + availability rules (admin CRUD only)** — professional must be able to define services (with duration/buffer) and working hours/blocks before anyone can book against them.
3. **Slot computation (read-only)** — pure derivation logic from step 2, unit-testable in isolation, no payment involved yet.
4. **Booking creation with the concurrency-safe hold** — `awaiting_payment` state + `EXCLUDE` constraint proven to reject overlaps, still no real payment integration (can stub/fake the charge).
5. **Payment gateway integration + shared webhook infrastructure** (signature verification, `webhook_events` idempotency table, status-reconciliation-not-payload-trust) — built once, generically, since both booking deposits and course purchases need it.
6. **Wire booking to payments**: confirm/expire transitions, `hold_expires_at` sweep job.
7. **WhatsApp send capability (outbound only)** — prove template-message sending works before building a scheduler on top of it.
8. **Reminder scheduling + reschedule/cancel sync** — depends on 6 (confirmed state exists) and 7 (send capability exists); this is where most of the subtle correctness bugs live, so keep it as its own build step with its own tests.
9. **Professional agenda management** (view, reschedule, cancel, mark completed/no-show) — depends on 4–6.
10. **Course catalog + lesson authoring (admin side)** — depends only on step 1 (identity); can be built in parallel with steps 2–9 by a separate workstream.
11. **Course purchase → enrollment**, reusing the shared payment/webhook infrastructure from step 5.
12. **Video delivery (signed URLs) + student area + progress tracking** — depends on 10 and 11.

**Parallelization implication for the roadmap:** steps 1 and 5 are the only hard dependencies shared between the booking track (2–4, 6–9) and the course track (10–12). Once identity and the payment/webhook layer exist, the two "fronts" of the product can genuinely be built as independent phases — which matches this being a two-sided product where neither side is "extra."

## Sources

- [I Solved Double-Booking Without Locks — Using One PostgreSQL Constraint](https://dev.to/akincskn/i-solved-double-booking-without-locks-using-one-postgresql-constraint-209m) — MEDIUM (community, cross-checked against PostgreSQL official EXCLUDE/GiST documentation pattern)
- [PostgreSQL's GiST Exclusion Constraint: The Database-Level Answer to Double Bookings](https://amitavroy.com/articles/postgresql-gist-exclusion-constraintthe-database-evel-answer-to-double-bookings) — MEDIUM
- [Handling the Double-Booking Problem in Databases](https://adamdjellouli.com/articles/databases_notes/07_concurrency_control/04_double_booking_problem) — MEDIUM
- [Mercado Pago Developers — Webhooks / Notifications](https://www.mercadopago.com.co/developers/en/docs/your-integrations/notifications/webhooks) — HIGH (official gateway documentation)
- [Mercado Pago Developers — Configure payment notifications](https://www.mercadopago.cl/developers/en/docs/checkout-pro-preferences/payment-notifications) — HIGH (official)
- [Official WhatsApp API: Streamline scheduling and reminders](https://www.chatarchitect.com/news/official-whatsapp-api-streamline-scheduling-and-reminders) — MEDIUM
- [WhatsApp Business API for Reminders: How It Works](https://www.yougot.ai/blog/work/appointment-management/what-is-whatsapp-business-api-for-reminders) — MEDIUM
- [Securing Private Content with Amazon CloudFront: Signed URLs, Signed Cookies, and Access Control](https://medium.com/@sharathkumarlokesh/securing-private-content-with-amazon-cloudfront-signed-urls-signed-cookies-and-access-control-b42f267cfd62) — MEDIUM
- [BullMQ — Job Schedulers documentation](https://docs.bullmq.io/guide/job-schedulers/) — HIGH (official library documentation)
- [Move reminder scheduling to a queue-based architecture (design discussion)](https://github.com/gkostgeorgiev/appointment-reminder-api/issues/4) — MEDIUM
- Domain knowledge (state machine design, timezone handling, insert-first idempotency pattern) cross-checked against the above rather than asserted from memory alone — treat as HIGH for the general patterns, MEDIUM for Brazil-specific provider details (verify exact gateway/WhatsApp provider choice during STACK research)

---
*Architecture research for: solo beauty-professional booking + recorded-course platform (Brazilian market)*
*Researched: 2026-09-18*
