# Pitfalls Research

**Domain:** Solo beauty-professional appointment booking (deposit payments, WhatsApp reminders) + online recorded-course platform with student area — Brazilian market
**Researched:** 2026-09-18
**Confidence:** MEDIUM (cross-checked web sources for regulatory/API specifics; engineering patterns are well-established industry knowledge — see per-pitfall confidence notes)

## Critical Pitfalls

### Pitfall 1: Slot availability computed by "SELECT then INSERT" — double-booking under concurrency

**What goes wrong:**
Two clients open the booking page at the same moment, both see the 14:00 slot as free, both click "confirmar e pagar sinal" within milliseconds of each other. The backend does `SELECT * FROM appointments WHERE professional_id = ? AND time_range overlaps ?` to check availability, sees no conflict for *either* request (because neither has committed yet), and both INSERTs succeed. Now the lash designer has two clients booked for the same chair at the same time, and possibly two deposits charged for one slot she can only honor once.

**Why it happens:**
The availability check and the write are two separate statements, not one atomic operation. This is invisible in manual testing (one developer, one browser) and only appears under real concurrent load — exactly the situation a booking link is built to produce (a client posts availability on Instagram Stories, 5 people click the same slot in the same minute). It also happens with a *single* client double-clicking "Confirmar" or hitting back/forward during a slow network response.

**How to avoid:**
Never rely on application-level "check then write" logic as the source of truth. Enforce it at the database level:
- Postgres: an `EXCLUDE` constraint (GiST index) on `(professional_id, tstzrange(start_at, end_at))` that rejects any overlapping insert outright — the second concurrent request gets a constraint-violation error, not a silent double-book.
- If not using range types, a serializable transaction (`SELECT ... FOR UPDATE` on the relevant day/professional row) wrapping the overlap check + insert works too, but the exclusion constraint is simpler and self-documenting.
- Treat the constraint violation as an expected, user-facing outcome ("esse horário acabou de ser reservado, escolha outro") — not a 500 error.
- Add an idempotency key on the booking request (client-generated UUID stored with the appointment) so a double-click or retried request from the *same* client doesn't create two rows even before the payment step.

**Warning signs:**
- Availability check and booking creation live in separate API calls (e.g., "hold slot" then "confirm payment" as two round trips with no lock in between).
- No unique/exclusion constraint exists in the schema for `(professional_id, time_range)` — availability is enforced only in application code.
- Load/concurrency testing was never done on the booking endpoint before launch.

**Phase to address:**
Booking/scheduling core phase (schema + booking-creation logic), before payment integration is layered on top. This must be right at the data-model level from the first version — retrofitting an exclusion constraint after real appointments exist is a painful migration.

---

### Pitfall 2: Deposit charged before slot is actually reserved (or slot released without deposit reconciliation)

**What goes wrong:**
Two related failure modes: (a) the system creates the appointment as "confirmed" the instant the client submits the booking form, *before* the Pix payment actually clears — so a slot is locked based on an intention to pay, not an actual payment, and if the client never pays, the slot sits fake-reserved and unavailable to others; or (b) the opposite — the system doesn't reserve the slot at all until payment confirms, so between "client clicks pay" and "webhook confirms Pix," another client can grab the same slot, and now one of two paying clients has to be refunded and disappointed.

**Why it happens:** Developers pick one of two naive models — "reserve first, hope they pay" or "wait for payment, hope nobody else grabs it" — without an explicit intermediate state.

**How to avoid:**
Introduce a `pending_payment` state with a short TTL (e.g., 10-15 minutes): the slot is soft-locked (counted as unavailable to other bookers) the moment the client starts checkout, but expires and releases automatically if no payment webhook arrives in time. Only a confirmed webhook moves the appointment to `confirmed`. A background job (or the exclusion constraint including `pending_payment` rows) prevents a second client from grabbing a soft-locked slot during that window. This is standard e-commerce "cart reservation" pattern applied to time slots.

**Warning signs:** Appointment status has only two states (booked/cancelled) with no pending/expiring state; no scheduled job exists to clean up abandoned pending bookings.

**Phase to address:** Payment integration phase, designed jointly with the booking core (the state machine must exist before Pix is wired in).

---

### Pitfall 3: Trusting the client redirect/callback instead of the payment webhook

**What goes wrong:**
After a Pix payment, the gateway redirects the browser back to a "success" page, or the frontend polls a status endpoint. A common shortcut is to mark the appointment/course purchase as paid the moment the frontend says "payment succeeded" — but the browser can be closed, the redirect can be spoofed or replayed, the network can drop before redirect, or a malicious client can simply call `POST /appointments/:id/confirm` directly, skipping payment altogether.

**Why it happens:** The webhook flow (server-to-server, async, requires signature verification and idempotency handling) is more work than "trust what the frontend tells me," and it works fine in every manual test because the developer always pays successfully and always sees the redirect.

**How to avoid:**
The **only** source of truth for "this appointment/course is paid" is the gateway's server-to-server webhook (Pix payment confirmation), verified by signature. The client redirect is purely a UX convenience ("estamos confirmando seu pagamento...") — it must never itself flip payment status. On redirect, show a "processing" state and let the frontend poll the *backend's* state (which only the webhook can change), or update via websocket/SSE once the webhook lands.

**Warning signs:** Any code path that sets `paid = true` or `status = confirmed` inside a request handler triggered by the browser (redirect endpoint, "check payment" button) rather than inside the webhook handler.

**Phase to address:** Payment integration phase — this is a foundational design decision for both the booking deposit flow and the course purchase flow, not a detail to patch later.

---

### Pitfall 4: Payment webhook without idempotency handling or signature verification

**What goes wrong:**
Payment gateways (Mercado Pago, Pagar.me, etc.) deliver webhooks **at-least-once**, not exactly-once — network retries, gateway-side redelivery on timeout, and manual replays from the gateway dashboard are all normal. If the webhook handler isn't idempotent, a redelivered "payment approved" event can double-charge internal logic (e.g., send the confirmation WhatsApp message twice, decrement course inventory twice, or — worse — if refund and payment events race, apply them out of order and leave the appointment in the wrong state). Separately, if the endpoint doesn't verify the gateway's signature, anyone who discovers the webhook URL (easy to find via a leaked API doc or by hitting common paths) can POST a fake "payment approved" event and get a free service or course.

**Why it happens:** Idempotency and signature verification aren't visible in a happy-path demo; they only matter under real gateway retry behavior and adversarial traffic, both of which are absent from local development.

**How to avoid:**
- Verify the gateway's webhook signature (HMAC or equivalent, per provider docs) on every request before touching business logic; reject unsigned/invalid requests with 401 and log them.
- Deduplicate using the provider's own event/transaction id (e.g., Pix `endToEndId` or the gateway's payment/event id) stored in a table with a unique constraint; if the id was already processed, return 200 immediately without reprocessing.
- Handler pattern: verify signature → check dedup table → if new, persist the event and enqueue processing → return 2xx fast. Do the "send WhatsApp confirmation" / "grant course access" work in a follow-up step, not synchronously inside the webhook request (a slow WhatsApp API call inside the webhook handler risks the gateway timing out and retrying, compounding the duplicate problem if idempotency isn't solid).

**Warning signs:** Webhook handler has no unique constraint on `provider_event_id`; no signature check in the route; "payment approved" logic and "send confirmation message" logic run in the same synchronous block.

**Phase to address:** Payment integration phase — build the webhook handler with idempotency table and signature check from day one; do not treat it as a later hardening pass.

---

### Pitfall 5: Cancellation/refund flow not wired to the same webhook-driven state machine

**What goes wrong:**
Deposits get refunded manually (Pix transfer outside the system) because the "cancelar agendamento" feature only changes an internal status flag and never talks to the payment gateway's refund API — so the system says "cancelado" while the client is still waiting for money back, or the professional forgets and a chargeback/complaint follows. On the course side, a 7-day withdrawal request (see Pitfall 10) needs the same real refund + access-revocation flow, and if it's bolted on separately it's easy to revoke course access without actually refunding, or refund without revoking access.

**Why it happens:** Refunds are the "sad path" that gets deprioritized until a real client asks for one in production.

**How to avoid:** Design cancellation as a state transition that *always* triggers a refund-gateway call (or a clearly logged "refund pendente - ação manual necessária" task if the gateway doesn't support your refund scenario) and, for courses, revokes access atomically with the refund record. Track refund status (`requested → processing → completed/failed`) separately from appointment/purchase status so a failed refund is visible and actionable, not silently lost.

**Warning signs:** "Cancel" button only updates a local status column; no refund-gateway API call exists anywhere in the codebase; no admin view showing pending/failed refunds.

**Phase to address:** Same phase as payment integration (deposit) and course purchase — refund is not a "later" feature, it's part of the same state machine.

---

### Pitfall 6: Using an unofficial WhatsApp provider (Z-API, Evolution API, Baileys-based) and getting the number banned

**What goes wrong:**
Unofficial providers connect through WhatsApp's consumer app protocol (not the real Business Platform API), which WhatsApp actively detects and bans. Warning signs found in real incident reports: sudden bans right after connecting a number to the provider, bans triggered by burst-sending (e.g., a round of appointment reminders sent all at once to many clients in a short window), high block/report rates from recipients, and messaging people who never opted in. When the number is the professional's *only* business WhatsApp — the same one clients already know and trust — a ban is catastrophic: it's not just "the reminders stop," it's "the professional loses her entire client communication channel with no warning and no appeal path," since the unofficial provider has no control over WhatsApp's ban decision and can't get it reversed.

**Why it happens:** Unofficial APIs are cheaper and faster to set up (no Meta Business verification, no template approval wait), so they're an attractive shortcut for an MVP — but the cost model (cheap or free per message) exists precisely because there's no compliance guarantee behind it.

**How to avoid:**
- Use the official WhatsApp Business Platform (Cloud API) via Meta directly or a Business Solution Provider (BSP), even though it costs more per message and requires template pre-approval and a verified Business Manager account.
- If cost is prohibitive at MVP stage and an unofficial provider is used as a stopgap, treat the number as **disposable and separate from the professional's personal/primary WhatsApp** — never risk the number she already uses with existing clients — and set explicit, conservative send-rate limits (spread reminders over time, never a burst to hundreds of contacts at once) plus strict opt-in enforcement.
- Whichever provider is chosen, this is a decision the project's own constraints flag as "pending research" (see PROJECT.md) — treat the official-vs-unofficial tradeoff as a first-class architecture decision, not an implementation detail.

**Warning signs:** Reminders sent in a single burst job rather than staggered; no per-recipient opt-in record; provider selected purely on price without checking ban-rate community reports; the WhatsApp number used is the same one the professional already uses personally/with existing clients.

**Phase to address:** WhatsApp integration phase — the official-vs-unofficial decision blocks this phase's design and should be resolved (ideally via dedicated feasibility research) before implementation starts, not discovered mid-build.

---

### Pitfall 7: Meta template rejections and the 24-hour window blocking reminders

**What goes wrong:**
If the official Cloud API is used: reminder and confirmation messages sent *outside* a 24-hour window since the client's last inbound message require a pre-approved template — free-form messages are rejected outside that window. Templates get rejected by Meta's review for reasons that look arbitrary (too promotional-sounding, missing required variable formatting, category mismatch — e.g., classifying a reminder as "Marketing" when it should be "Utility"), and rejection isn't instant, so an MVP team can build the whole reminder flow assuming templates "just work," then discover in near-launch testing that reminders silently fail because the template was never approved, or the window already closed since the booking was made days ago.

**Why it happens:** The 24-hour window is a rolling window tied to the *client's* last message, and most appointment bookings are made far more than 24 hours before the appointment (that's the whole point of a reminder) — so nearly every reminder will be sent outside the window and *must* go through an approved template, not free text. Developers who build and test with a fresh conversation (where the window is open) don't hit this until testing a realistic multi-day booking-to-appointment gap.

**How to avoid:**
- Register and get Meta approval for the required templates (booking confirmation, reminder N hours/days before, cancellation notice) early — before the reminder-sending logic is built — since approval can take review cycles and rejections require resubmission.
- Classify templates correctly: transactional appointment confirmations/reminders should be "Utility," not "Marketing" (Utility messages are cheaper and have looser content restrictions; misclassifying as Marketing both costs more and is more likely to get rejected).
- Build the reminder job to check template-send success/failure per message (the Cloud API returns delivery status) and alert/log failures rather than assuming fire-and-forget success.

**Warning signs:** Templates not yet submitted for approval when reminder-scheduling logic is already built; no handling for a "template rejected" or "message failed" webhook/status; reminder logic tested only with a WhatsApp number that just messaged the business (window artificially open).

**Phase to address:** WhatsApp integration phase — submit and get templates approved as an early task within this phase, not the last step before launch.

---

### Pitfall 8: Per-message cost surprise at scale, and un-metered reminder logic

**What goes wrong:**
Since mid-2025, Meta bills per delivered template message (Utility/Marketing/Authentication) by category and recipient country, not a flat per-conversation fee — Brazil's marketing rate is meaningfully higher than markets like the US. For a solo professional this is a small absolute number at first, but a naive implementation (e.g., resending a reminder on every retry without dedup, or sending both a "confirmation" and a redundant "reminder" template for the same appointment 3 times) multiplies cost invisibly. Free-form replies inside the 24h window are free — so a badly designed flow that always uses a template even when a free-form reply would work also burns money unnecessarily.

**Why it happens:** Pricing details are easy to overlook during build since Meta's sandbox/test numbers don't reflect production billing, and nobody notices the cost line until a real invoice arrives.

**How to avoid:** Design the reminder job to send at most one template per event (booking confirmed, reminder-X, cancellation), track a "sent" flag per appointment/event to prevent duplicate sends, and prefer free-form messages when already inside an open window (e.g., replying to a client who just texted a question). Budget per-message cost into the pricing model of the deposit/course product from the start rather than treating messaging as free infrastructure.

**Warning signs:** No "already sent" tracking on reminder jobs; reminder scheduler runs on every cron tick without checking what was already sent; no monitoring/alerting on monthly WhatsApp spend.

**Phase to address:** WhatsApp integration phase (cost-aware design) with a monitoring/alerting task revisited post-launch as volume grows.

---

### Pitfall 9: WhatsApp messaging without valid opt-in / consent record

**What goes wrong:**
Sending confirmations and reminders to a phone number collected only for booking, without a clear separate consent for WhatsApp business messaging, risks both Meta policy violations (a phone number that reports "wasn't expecting this") — contributing to block/report rate and, cumulatively, business account restrictions — and LGPD exposure, since using the number's data for messaging beyond the strict "confirm this specific appointment" transactional purpose without adequate legal basis is a compliance gap.

**Why it happens:** In this product's flow, the client *does* provide her number specifically to book — so it feels obviously consensual — but "using the number to confirm this appointment" and "using the number to send a reminder days later" and, especially, "using the number for any future marketing" are legally and practically distinct uses that need to be made explicit.

**How to avoid:** At the point of collecting the phone number, state plainly what it will be used for (confirmação, lembretes do agendamento) as part of the booking flow itself — this "legitimate interest / contract execution" basis is generally sufficient for transactional confirmations/reminders tied to the appointment/course the client is actively purchasing, without requiring a separate opt-in checkbox for that narrow purpose. Any *additional* use (promotional campaigns, "aproveite esse desconto") is a different purpose requiring its own explicit consent, captured and recorded separately, with an easy opt-out.

**Warning signs:** A single blanket "aceito os termos" checkbox covers both transactional messaging and marketing without distinction; no record of what a client consented to and when; no opt-out mechanism for promotional messages.

**Phase to address:** WhatsApp integration phase for the transactional-use design; explicitly deferred/flagged if any marketing-message feature is added later (marketing messaging is out of this project's stated scope but the *data model* for consent should not block it).

---

### Pitfall 10: Deposit forfeiture policy that violates the CDC — and building it into the product as a "penalty"

**What goes wrong:**
A very natural product instinct — "if the client no-shows or cancels last-minute, she loses the sinal, that discourages no-shows" — runs into real legal risk under Brazilian consumer law. Brazilian case law (including a cited TJDFT ruling) treats contract clauses that strip the consumer's refund option entirely as **null** under CDC Art. 51, II (abusive clauses that reduce consumer rights), and blanket/full retention of a deposit regardless of circumstances has been found abusive; courts generally expect any retention to be *proportional to actual loss/inconvenience* rather than a flat forfeiture. Separately and independently, CDC Art. 49 gives consumers a 7-business-day unconditional right of withdrawal for purchases made outside a physical establishment (which includes online booking) — meaning a client who books and pays a deposit, then cancels within 7 days *and before the service was rendered*, has a strong legal claim to a full refund regardless of the platform's stated cancellation policy, if the appointment itself is more than 7 days out.

**Why it happens:** "No-show deposits" are common industry practice and feel obviously fair from the business side, but the specific mechanics (full forfeiture, no graduated policy, no accommodation of the 7-day withdrawal right) are exactly the pattern Brazilian courts have struck down.

**How to avoid:**
- Design a graduated, clearly-disclosed cancellation policy instead of "lose it all": e.g., full refund if cancelled with more than X hours notice, partial retention (proportional to the inconvenience/lost opportunity, not the full amount) for late cancellation, and clear terms shown *before* payment, not buried in fine print afterward.
- Explicitly honor the 7-day CDC withdrawal window for cancellations made well ahead of the appointment date — don't build logic that hard-blocks refund requests inside that window.
- Treat "no-show" (client simply doesn't appear) differently from "cancellation" (client proactively cancels) in the policy and in the UI copy, since the legal and practical reasoning differs.
- This is a legal-risk area, not just a UX one — flag it for a lightweight lawyer/consultant sanity check before launch if the product will handle real money at scale; the research here establishes the *pattern* to avoid, not a substitute for legal advice.

**Warning signs:** Policy copy says "sinal não é reembolsável em nenhuma hipótese"; no distinction between early cancellation, late cancellation, and no-show; refund logic has no code path for "client requests refund within 7 days, appointment is far in the future."

**Phase to address:** Booking/deposit policy design, addressed alongside the payment integration phase — this is a product/business-rule decision that needs to be settled before the cancellation flow is built, and reflected in the terms shown at checkout.

---

### Pitfall 11: Course purchase refund/withdrawal not designed for the 7-day CDC right combined with content access

**What goes wrong:**
The same CDC Art. 49 right of withdrawal applies to course purchases: a student can request a full refund within 7 business days of purchase, no justification needed. Two failure modes: (a) building the product as if this right doesn't exist for digital content ("curso digital, sem devolução" is not a legally safe policy in Brazil), and (b) at the other extreme, not designing *any* safeguard against abuse — a student who watches every video in the first 2 days, extracts everything of value, then requests a refund on day 6, which courts have flagged as a potential abuse-of-right situation that sellers should design against (e.g., proportional/limited access terms) rather than simply eating the loss or illegally denying the refund.

**Why it happens:** "Digital goods aren't refundable" is common intuition from other markets/platforms, but doesn't hold under Brazilian consumer law the way it might elsewhere; and building watch-progress tracking (which this project already requires, per PROJECT.md) creates the data needed to reason about "how much was actually consumed," which is easy to leave unused.

**How to avoid:**
- Honor the 7-day withdrawal right by default and process refund + access revocation together (see Pitfall 5).
- Use the required watch-progress-tracking feature as the mechanism to detect disproportionate consumption in the refund window, and document (in Terms of Service, shown at purchase) a reasonable, legally-defensible policy for that edge case rather than silently refunding abuse cases at will or silently denying legitimate ones.
- Do not build a hard technical block that prevents refund requests inside 7 days — that block itself would be the violation.

**Warning signs:** Course purchase terms say no refunds; no code path connects "refund granted" to "revoke access to course content"; refund requests are handled manually via WhatsApp with no system record (defeats the "zero WhatsApp" core value of the product).

**Phase to address:** Course purchase/checkout phase, alongside the payment integration and student-area/progress-tracking phases (the access-revocation and progress data both need to exist for this to work).

---

### Pitfall 12: LGPD treated as "doesn't apply to a solo operator"

**What goes wrong:**
A one-person business assumes LGPD compliance is only for large companies, and skips basic hygiene: no privacy policy, no record of what data is collected and why, no defined retention period, client/student personal data (name, phone, CPF if collected, payment metadata, video-watch history) stored indefinitely with no deletion path, and — specific to this project — the WhatsApp number and appointment history treated as freely reusable for any future purpose.

**Why it happens:** LGPD enforcement stories in the news are about large breaches at big companies, making the law feel irrelevant to a solo business; but the law's *applicability* (Art. 3º) is not limited by company size — only some *penalties* are reduced for small revenue.

**How to avoid (realistic scope for a solo operator, not a full enterprise compliance program):**
- Collect only what's needed for each specific screen (booking needs name + phone; deposit payment needs whatever the gateway requires; course access needs email/login — don't collect CPF or address "just in case").
- Publish a short, plain-language privacy notice (política de privacidade) covering: what's collected, why, how long it's kept, and how a client/student can request deletion — this can be a single page, not a legal treatise, but it must exist and be linked at signup/checkout.
- Keep payment data handling to "whatever the gateway's hosted checkout/tokenization provides" — never store raw card data; Pix reduces this risk since it has no card-number equivalent, but transaction metadata (payer name, amount, timestamp) still counts as personal data.
- Define a retention/deletion practice, even a simple one (e.g., "inactive client data older than N years is purged" or "available on request") rather than "keep everything forever by default."
- Treat WhatsApp consent as described in Pitfall 9 — this is the LGPD-relevant part of the messaging feature specifically.

**Warning signs:** No privacy policy page exists anywhere in the product; database has no `deleted_at`/anonymization path for a client who asks to be forgotten; support/admin panel exposes full client history with no access control beyond "logged in as the professional."

**Phase to address:** Cross-cutting — a baseline (privacy policy page, minimal data collection, no raw payment data storage) should land in the same phase as account/checkout creation; retention/deletion tooling can be a lighter-weight follow-up phase since it's less urgent for a pre-launch MVP but should not be dropped from the roadmap entirely.

---

### Pitfall 13: Building multi-professional / team features nobody will use

**What goes wrong:**
Because "appointment booking SaaS" as a category almost always implies multiple staff members, multiple calendars, and role-based permissions, it's easy to default into modeling `professional_id` as a first-class multi-tenant concept, building staff-invite flows, per-staff-member availability UIs, and admin roles — none of which this specific product needs, since PROJECT.md explicitly scopes this to one solo operator and marks multi-professional support as *out of scope* ("o negócio é solo hoje; multi-profissional vira complexidade de escala sem valor imediato").

**Why it happens:** Generic scheduling-system tutorials, boilerplates, and mental models default to multi-tenant because that's the more common commercial pattern; it's also tempting to "future-proof" for hypothetical growth.

**How to avoid:** Model the schema and UI for a single professional explicitly (no `staff` table, no per-user calendar selection, no team-invite/roles system). If the schema needs *a* professional reference for clarity (e.g., a `professional_id` column exists because the course-catalog and appointment tables both belong to "the business"), that's fine — the distinction is not "never reference an owner," it's "never build UI/permissions/workflow for *more than one* owner." The same discipline applies to the course side: no multi-instructor course marketplace, no cohort/class-based scheduling (explicitly out of scope — courses are pre-recorded, self-paced).

**Warning signs:** A "convite de equipe" or "adicionar profissional" feature appears on the roadmap or backlog without an explicit business reason tied to *this* product's stated scope; the availability-management UI has a professional-selector dropdown with only one option in it, ever.

**Phase to address:** Architecture/schema-design decisions at the start of the booking core phase — this is cheapest to get right from the first data model, and expensive to unwind if multi-tenant assumptions creep into the schema early.

---

### Pitfall 14: Reminder jobs that duplicate-send, send after cancellation, or send at absurd hours

**What goes wrong:**
Three concrete failure patterns in reminder scheduling: (a) a cron-based reminder job re-evaluates "which appointments need a reminder" on every run without a persisted "already sent" marker, so a slow query, a server restart, or an overlapping job run sends the same reminder 2-3 times to the same client; (b) an appointment is cancelled *after* its reminder was already scheduled/queued, but the cancellation flow doesn't cancel the pending reminder job, so the client gets "seu horário é amanhã às 14h!" for an appointment that no longer exists; (c) reminders computed with a naive time-of-day offset (e.g., "24h before") applied without regard to reasonable sending-hour bounds can fire a WhatsApp message at 3am if the appointment itself is early morning, or a timezone/DST-adjacent bug shifts the computed send-time by an hour around historical DST-transition dates even though Brazil currently has no DST (device/server timezone misconfiguration, or a library defaulting to UTC-naive arithmetic, can still produce an off-by-one-hour reminder).

**Why it happens:** Reminder scheduling looks simple ("send 24h before") but is actually a job-idempotency and state-synchronization problem: the job needs to know both "was this already sent" and "is this appointment still valid" at send time, not just at schedule time, and clock/timezone math is a classic source of silent off-by-one errors that don't show up until a specific date/offset combination is hit in production.

**How to avoid:**
- Persist a `reminder_sent_at` (or a table of scheduled-reminder records with status) per appointment/reminder-type, and have the send job check-and-set atomically (or use a job queue with built-in dedup) so a re-run never double-sends.
- On cancellation, actively cancel/invalidate any pending reminder job for that appointment (don't rely on the job to "notice" cancellation at send time only — check appointment status immediately before sending as a final guard, in addition to cancelling the scheduled job).
- Store all appointment times in a fixed reference (UTC in the database) and convert to America/Sao_Paulo only for display and for computing "is this a reasonable hour to send" — never do reminder-offset arithmetic in a timezone-naive way. Even though Brazil abolished DST in 2019, don't hardcode a fixed UTC offset in application logic; use a proper timezone-aware library/zoneinfo so the code is correct regardless of future policy changes and doesn't silently misbehave for any historical/legacy data.
- Add an explicit "don't send outside 8am-9pm local time" guard on the reminder job, independent of the offset calculation, so a poorly timed appointment (e.g., an 8am slot with a "12h before" reminder) doesn't produce a message sent at 8pm the night before at an hour that's fine, but a slightly different configuration doesn't accidentally produce a 5am send.

**Warning signs:** Reminder job queries "appointments happening in ~24h" fresh on every run with no sent-marker; cancellation endpoint doesn't touch any reminder/job table; date/time arithmetic uses raw `Date` math or string offsets instead of a timezone-aware library; no test exists for "appointment cancelled after reminder was scheduled but before it fired."

**Phase to address:** WhatsApp integration / reminders phase, built jointly with the booking-cancellation flow so the two are never developed in isolation from each other.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| App-level overlap check instead of DB exclusion constraint | Faster to write, ORM-friendly | Silent double-bookings under real concurrent traffic | Never for the booking core — this is the product's core value |
| Unofficial WhatsApp provider for MVP speed | No Meta Business verification wait, cheaper per-message | Risk of losing the business's only client-communication channel overnight | Only with a disposable, non-primary number, low volume, and a clear migration plan to official API before real launch volume |
| Trusting frontend "payment success" state | Simpler to build, no webhook plumbing needed | Free services/courses granted without payment; unrecoverable once exploited | Never |
| Flat "sinal não reembolsável" policy copy | Simple to write, no edge-case logic | Legally unenforceable under CDC, real refund disputes | Never |
| Storing all appointment times as local wall-clock strings | Feels simpler, matches what's shown to the user | Timezone bugs surface unpredictably around any future policy/library change or server relocation | Never — store UTC, convert at display/compute time |
| No "already sent" dedup on reminder jobs | Faster to ship the first cron job | Duplicate/annoying messages that erode client trust in the product | Never, this is cheap to do correctly from day one |
| Skipping a privacy-policy page at launch | One less page to build | LGPD exposure, harder to retrofit consent flows later | Only for a private, invite-only alpha with zero real client data — never for real launch |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Pix / payment gateway | Marking payment confirmed from client redirect/polling instead of webhook | Webhook is the only source of truth; redirect is UX-only |
| Pix / payment gateway | No idempotency dedup on webhook events | Dedup on provider event id with a unique DB constraint before processing |
| WhatsApp Cloud API | Sending free-form reminder text outside the 24h window | Use approved Utility templates for anything outside the window; test with a stale conversation, not a fresh one |
| WhatsApp Cloud API | Classifying transactional reminders as "Marketing" templates | Use "Utility" category for appointment confirmations/reminders — cheaper and less likely to be rejected |
| WhatsApp unofficial provider (if chosen) | Bursting all reminders in one batch job | Stagger sends; respect opt-in; treat the number as disposable, separate from the professional's personal number |
| Course video hosting/CDN | Serving raw permanent video URLs (no expiry, no auth) | Use short-lived signed URLs (hours, not permanent) plus basic domain/session restriction |
| Refund/cancellation | Cancelling in-app without calling the gateway's refund API | Cancellation always triggers a refund-gateway call or a tracked "manual refund pending" task |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Recomputing full month availability on every page load with no caching | Booking page feels slow, DB load spikes when a link is shared publicly | Cache computed availability per day/professional with short TTL, invalidate on booking/cancellation | Noticeable once a story/post drives a burst of simultaneous visitors — plausible even at very low total user counts for a solo business |
| Unbounded video bandwidth on a pay-as-you-go CDN/S3 setup | Surprise hosting bill after a course sells well or a video gets widely (re)shared | Use a video-hosting plan with bandwidth caps/predictable pricing, or set alerts on egress spend from day one | Breaks financially, not technically — can happen at very low view counts if using raw cloud egress pricing |
| Synchronous WhatsApp API calls inside the payment webhook handler | Webhook response is slow, gateway may retry (compounding duplicate risk) | Webhook handler only verifies + persists + ACKs fast; message-sending happens in an async follow-up job | As soon as WhatsApp API latency is nontrivial, even at low volume |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No webhook signature verification | Anyone can forge a "payment approved" event and get free service/course access | Verify gateway-provided signature on every webhook before processing |
| Storing raw payment/card details | PCI exposure, LGPD sensitive-data risk | Use gateway-hosted checkout/tokenization; store only transaction metadata |
| Course video URLs that are permanent/unauthenticated | Trivial content leakage/sharing | Short-lived signed URLs + session/domain checks (accepting that full prevention is impossible) |
| Admin (professional) panel with no auth separate from client/student accounts | A compromised client login could expose all clients' data | Fully separate authentication and authorization for the professional's admin view vs. client/student accounts |
| Booking/cancellation endpoints with no ownership check | A client could cancel or view another client's appointment by guessing/incrementing an ID | Verify the authenticated (or token-linked) identity owns the appointment before allowing read/cancel actions |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Forcing full account creation just to book one appointment | Friction reintroduces the "just message on WhatsApp" temptation the product exists to remove | Lightweight identification for booking (name + phone, maybe a magic-link/OTP) distinct from the full persistent account the course side needs |
| Cancellation policy shown only after payment | Feels like a bait-and-switch, invites disputes/chargebacks | Show cancellation/refund terms clearly before the payment step |
| No visible feedback while waiting for Pix confirmation webhook | Client thinks the booking failed and retries, risking duplicate payment attempts | Explicit "confirmando pagamento..." state with polling/websocket update, and clear success/failure resolution |
| Reminder message with no easy way to reach the professional for a real question | Client falls back to a separate WhatsApp thread, undermining "zero WhatsApp bookings" goal | Reminder template can note that replying opens a normal WhatsApp conversation window for questions, without breaking the self-service booking flow itself |

## "Looks Done But Isn't" Checklist

- [ ] **Booking flow:** Looks done with a single manual test but often missing a DB-level concurrency guard — verify with a concurrent-request test (two simultaneous bookings for the same slot) that only one succeeds.
- [ ] **Payment confirmation:** Looks done when "pagar" redirects to a success page — verify the *webhook* handler alone, with the frontend disconnected, correctly flips the appointment to confirmed (i.e., the frontend redirect is provably not required for state to update).
- [ ] **Reminder sending:** Looks done when one test reminder fires correctly — verify no duplicate sends occur across a job restart, and that cancelling an appointment after scheduling its reminder actually prevents the send.
- [ ] **Cancellation/refund:** Looks done when the status flips to "cancelado" — verify a real refund-gateway call (or a tracked manual task) actually happens, and for courses, that access is revoked in the same transaction/flow.
- [ ] **WhatsApp templates:** Looks done in a sandbox conversation (window always open) — verify sending to a contact whose last message was days ago, which forces the approved-template path.
- [ ] **Course access after purchase:** Looks done when the happy path (pay, then immediately access) works — verify access is also correctly revoked after a refund/withdrawal, and that a lapsed/refunded student can't still reach video URLs previously obtained.
- [ ] **LGPD basics:** Looks done when a generic privacy-policy template is pasted in — verify it actually reflects what data this specific product collects (phone for booking, watch-progress for courses, payment metadata) and includes a real deletion-request path.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|-----------------|
| Double-booking already occurred in production | MEDIUM | Manually contact one of the two clients to reschedule, add the DB exclusion constraint retroactively (may require cleaning existing overlap conflicts first), add concurrency test coverage |
| WhatsApp number banned (unofficial provider) | HIGH | Migrate to official Cloud API on a new number, notify existing clients via another channel (Instagram, SMS) of the new number, absorb the trust/continuity hit |
| Deposit-retention policy already challenged/disputed by a client | MEDIUM | Refund the disputed case, rewrite policy to a graduated/proportional model, update checkout copy, consider a one-time consultation with a consumer-law-aware advisor |
| Webhook exploited to fake a payment (no signature check) | HIGH | Immediately add signature verification, audit all "paid" records created since launch against the gateway's real transaction log, revoke access/appointments for unverifiable ones, refund/apologize as needed |
| Duplicate reminder sends already annoying clients | LOW | Add sent-tracking retroactively, apologize via next legitimate message, no data loss involved |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Double-booking race condition | Booking core (schema + slot logic) | Concurrent-request test against the same slot; DB constraint exists and is exercised |
| Deposit reserved before payment clears / released incorrectly | Payment integration | State machine has an expiring pending-payment state; abandoned-booking cleanup job exists |
| Trusting client redirect over webhook | Payment integration | Manual test: disable frontend polling, confirm webhook alone flips status |
| Webhook idempotency & signature | Payment integration | Replay the same webhook event twice in a test — confirm no double-processing; send an unsigned request — confirm rejection |
| Cancellation not wired to real refund | Payment integration + booking cancellation | Cancel a paid appointment in a test environment, confirm a refund-gateway call or tracked task is created |
| Unofficial WhatsApp provider ban risk | WhatsApp integration (decision made before build) | Provider choice documented with rationale; if unofficial, send-rate limits and number-isolation strategy documented |
| Template rejection / 24h window | WhatsApp integration | Templates submitted and approved before reminder logic ships; reminder tested against a stale (>24h) conversation |
| Per-message cost blowout | WhatsApp integration | Sent-tracking prevents duplicate template sends; spend monitoring/alerting exists |
| Missing WhatsApp opt-in/consent record | WhatsApp integration | Consent purpose is explicit at collection point; distinct from any future marketing consent |
| Deposit forfeiture violating CDC | Booking/deposit policy design (with payment integration) | Policy is graduated, not blanket; 7-day withdrawal path exists in code, not just docs |
| Course refund vs. 7-day CDC right | Course purchase/checkout | Refund flow honors 7-day window; progress-tracking data available to reason about abuse cases |
| LGPD baseline gaps | Account/checkout creation phase | Privacy policy page live and linked; no raw payment data stored; deletion path exists (can be lighter-weight, later sub-phase) |
| Over-built multi-professional features | Architecture/schema design (booking core) | Schema and UI reviewed for single-owner assumptions before booking core is built |
| Reminder duplicate/late/wrong-hour sends | WhatsApp integration + cancellation flow | Sent-marker tested across job restarts; cancellation cancels pending reminder; timezone-aware library used, not raw offset math |

## Sources

- [WhatsApp Business Platform 24 Hour Rule (Enchant)](https://www.enchant.com/whatsapp-business-platform-24-hour-rule)
- [Understanding the 24-hour conversation window in WhatsApp messaging (ActiveCampaign)](https://help.activecampaign.com/hc/en-us/articles/20679458055964-Understanding-the-24-hour-conversation-window-in-WhatsApp-messaging)
- [WhatsApp 24-Hour Session Window: Rules, Costs & Support Ops Guide (2026) (Ominiflow)](https://ominiflow.com/blog/whatsapp-24-hour-session-window)
- [WhatsApp banido: causas, cuidados e como reduzir riscos em automações (Z-API)](https://z-api.io/blog/whatsapp-banido-causas-cuidados-e-como-reduzir-riscos-em-automacoes/)
- [Banimento de números WhatsApp após uso do Z-API (Reclame Aqui)](https://www.reclameaqui.com.br/z-api/banimento-de-numeros-whatsapp-apos-uso-do-z-api-e-alegacao-de-falta-de-rodi_2h4r2HHfyFJ9Jh_t/)
- [API WhatsApp Oficial vs Não-Oficial: Os Riscos Reais de Banimento (AraraHQ)](https://ararahq.com/blog/api-whatsapp-oficial-vs-nao-oficial-riscos)
- [WhatsApp API Pricing Update: Effective July 1, 2025 (YCloud)](https://www.ycloud.com/blog/whatsapp-api-pricing-update)
- [WhatsApp Business API Pricing in Brazil 2026 (Message Central)](https://www.messagecentral.com/blog/whatsapp-business-api-pricing-in-brazil)
- [Pricing on the WhatsApp Business Platform (Meta for Developers)](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- [Direito de arrependimento em ambiente digital (Turivius)](https://turivius.com/portal/direito-de-arrependimento-no-ambiente-digital/)
- [Consumidor pode desistir de curso online ou software em até 7 dias](https://ancora1.com/noticias/consumidor-pode-desistir-de-curso-online-ou-software-em-ate-7-dias)
- [Direito do Consumidor: Cancelamento de Curso e Reembolso de Valores](https://advogadospirituba.com.br/direito-consumidor-cancelamento-curso-reembolso-cdc/)
- [Cláusula que retira do consumidor opção de reembolso é nula (TJDFT)](https://www.tjdft.jus.br/institucional/imprensa/noticias/2020/novembro/maquiadora-deve-fornecer-cupom-a-consumidora-que-alterou-data-do-contrato)
- [LGPD para pequenos negócios: gestão de dados de clientes (Mercado Pago)](https://www.mercadopago.com.br/blog/lgpd-na-pratica-pequenos-negocios)
- [Opt-In WhatsApp Business em 2026: Consentimento + LGPD (SocialHub)](https://www.socialhub.pro/blog/opt-in-whatsapp-business-consentimento-lgpd/)
- [Handling Payment Webhooks Reliably (Idempotency, Retries, Validation) (Medium)](https://medium.com/@sohail_saifii/handling-payment-webhooks-reliably-idempotency-retries-validation-69b762720bf5)
- [How to Implement Webhook Idempotency (Hookdeck)](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency)
- [Pix API for businesses: integration, webhooks, and reconciliation (Troqpay)](https://troqpay.com/en/blog/pix-api-for-businesses-integration-webhooks-reconciliation)
- [How to Protect Your Online Course Videos from Piracy (Gumlet)](https://www.gumlet.com/learn/protect-online-course-videos-from-piracy/)
- [How to Prevent Users from Downloading Your Videos (Gumlet)](https://www.gumlet.com/learn/prevent-users-from-downloading-your-videos/)
- [I Solved Double-Booking Without Locks — Using One PostgreSQL Constraint (DEV Community)](https://dev.to/akincskn/i-solved-double-booking-without-locks-using-one-postgresql-constraint-209m)
- [Postgres EXCLUDE Constraints for Overlaps (Chat2DB)](https://chat2db.ai/resources/blog/postgres-exclusion-constraints-guide)
- [How to Solve the Double Booking Problem with PostgreSQL](https://jsupskills.dev/how-to-solve-the-double-booking-problem/)

---
*Pitfalls research for: solo beauty-professional appointment booking + online recorded-course platform (Brazilian market)*
*Researched: 2026-09-18*
