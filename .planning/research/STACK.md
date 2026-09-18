# Stack Research

**Domain:** Solo beauty-professional booking platform + recorded-course sales platform with student area — Brazilian market
**Researched:** 2026-09-18
**Confidence:** HIGH (framework, ORM, hosting, payment fee data, WhatsApp risk); MEDIUM (video-hosting pricing specifics, exact current gateway promo terms — these move often and should be re-verified against the provider's pricing page at implementation time)

## The Monolith-vs-Split Call (answered first, everything else follows from it)

**Recommendation: single Next.js full-stack monolith. Do not build a separate client/server deployment.**

The repo's empty `client/` and `server/` directories are **not** a commitment to a separated frontend/backend — they should be repurposed, not honored literally as two deployables:

- Collapse to **one Next.js app** as the single deployable unit.
- `server/` becomes an internal, server-only directory *inside* that one app (domain modules: identity, catalog, availability, booking, payments, notifications, courses — same module boundaries ARCHITECTURE.md already proposes), imported by Route Handlers and Server Actions. Guard it with the `server-only` npm package so nothing in it can accidentally leak into client JS.
- `client/` becomes `app/` (routes) + `components/` (UI) — the three trust zones ARCHITECTURE.md identifies (public booking, student area, admin) become three Next.js route groups: `app/(public)/`, `app/(student)/`, `app/(admin)/`, each with its own layout/middleware for the different auth posture, not three separate frontend projects.

**Why this beats a separated split for this project specifically:**

1. **One operator, one deploy.** A split (React SPA + Express/Nest API) buys you independent scaling and independent deploys — neither matters at "dozens of appointments/day, one professional." It only buys *more* things to configure, host, and keep in sync (CORS, two `package.json`s, two CI pipelines, two hosting bills) for zero benefit at this scale.
2. **Server Actions solve the exact two flows this product has.** Both the booking form (public, must feel instant, minimal JS) and the payment/webhook plumbing benefit from Next.js's ability to do server-side mutations without hand-rolling a separate REST/GraphQL API layer — write a Server Action, call it from a form, done.
3. **The only case for a split — a fully authenticated SPA/dashboard with no SEO need** — describes at most the admin panel, which is one route group inside the same app, not a reason to split the whole product.
4. **Vercel + Next.js is the path of least operational friction for a solo dev**, and it's also the natural home for Vercel Cron (reminders) and Vercel Postgres/Neon (database) — see below. A split architecture forces a second hosting target (Railway/Render for the API) with its own latency, billing, and deploy-key management, which is pure overhead here.

**When a split would be the right call instead (for calibration, not because it applies here):** a public marketing site needs to scale independently from a hot API, multiple frontend clients (native mobile + web) need to share one backend, or the team is large enough that frontend/backend release cadences genuinely need to be decoupled. None of that is true for a single-operator two-audience product at this scale.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js (App Router) | 16.3.5 | Full-stack framework — routing, SSR, Route Handlers, Server Actions, middleware | Confirmed current stable on the `next` npm dist-tag. Eliminates the need for a separate backend service; Server Actions cover both the booking mutation flow and the payment-initiation flow without a hand-built REST layer. |
| React | 19.3.0 | UI runtime | Required peer of Next.js 16 (`^19.0.0`); ships Server Components, which keep the public booking page's JS payload small — important on mobile data for Brazilian clients booking from Instagram links. |
| TypeScript | 7.0.2 | Type safety across the whole stack | TS 7.0 GA shipped July 2026 as a drop-in CLI-compatible native (Go) compiler — 8–12x faster builds/typechecking, same `typescript` package and `tsc` command, no migration needed. Safe default now, not an early-adopter risk. |
| PostgreSQL (hosted on Neon) | Postgres 17 / Neon serverless | System of record: appointments, clients, students, courses, payments, webhook idempotency | Postgres's `EXCLUDE` constraint (`btree_gist`) is the concrete mechanism ARCHITECTURE.md specifies for double-booking prevention — this requires a real Postgres, not a NoSQL store. Neon is the provider because it's Vercel's native "Vercel Postgres" backing, has a true serverless free tier (scale-to-zero, no idle cost for a low-traffic solo app), and gives branch-per-preview-deploy for free, which is a nice fit for a solo dev's iteration loop. |
| Prisma | `prisma` 7.10.0 CLI + `@prisma/client` 7.10.0 | ORM, schema migrations, type-safe query client | Prisma 7 (Nov 2025) replaced the old Rust query engine with a TypeScript/WASM engine — the historical Drizzle advantage ("Prisma is heavy/slow on serverless/edge") is now largely closed. For a solo, not-necessarily-full-time-backend developer, Prisma's schema-first migrations, generated types, and **Prisma Studio** (a GUI to inspect/edit data — genuinely useful for a non-technical business owner debugging "why does this client show unpaid") outweigh Drizzle's SQL-closer-to-the-metal control, which this project doesn't need. |
| Better Auth | 1.7.5 | Authentication for the persistent student-account side | See "Dual Identity Model" below — chosen specifically over NextAuth/Auth.js because Auth.js v5 (the App-Router-compatible version) has been in beta for over a year (`5.0.0-beta.32` as of this research) with no stable release, which is not what you want as the auth foundation of a production payments-adjacent app. Better Auth 1.x is stable, framework-agnostic, has a first-party Prisma adapter, and — notably — ships an `anonymous` plugin built for exactly the "guest session that can later become a real account" pattern this project's dual-audience identity problem needs (see below). |
| Mercado Pago (`mercadopago` Node SDK) | 3.6.1 | Payment gateway — Pix for booking deposits and course purchases | See full comparison below. Chosen over Asaas, Stripe, and Pagar.me. |
| Meta WhatsApp Cloud API | Graph API v20+ (direct REST, no SDK required) | Automated booking confirmations and reminders | Chosen over Z-API/Evolution API. See comparison below — this is a "your only client channel" reliability decision, not just a cost one. |
| Panda Video | N/A (SaaS, API + iframe embed) | Recorded course lesson hosting/streaming, anti-piracy protection | Brazilian platform built specifically for the "área de membros" course-creator use case; billed in BRL; includes DRM + dynamic watermark (viewer's name/email burned into the video during playback) + domain allowlisting. See comparison below. |
| Vercel | N/A (hosting platform) | Deployment, edge network, cron | Native home for a Next.js monolith; zero-config CI/CD from git push; `gru1` (São Paulo) function region available on the Pro plan for low-latency to Brazilian users. **Pro plan ($20/mo) is required regardless of latency needs** — Vercel's Hobby plan ToS prohibits commercial/for-profit use, and this is a revenue-generating product from day one. |
| Vercel Cron | Built into Vercel (Pro plan: per-minute cadence) | Scheduled job execution — reminder dispatch, hold-expiry sweep, webhook-retry drain | No external job broker needed at this volume (ARCHITECTURE.md already sizes this as "a lightweight DB-polled jobs table," not a queue). A Vercel Cron entry hitting a Route Handler every few minutes, which queries `reminders WHERE send_at <= now() AND status = 'pending'`, is the whole job runner. Hobby plan caps cron to once/day, which is why Pro is required here too (doubly justified, see above). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 4.6.5 | Runtime schema validation | Validate every Server Action input (booking form, payment webhook payload shape, course-authoring forms) — do not trust client input, especially on the payment path per PITFALLS.md Pitfall 4. |
| `react-hook-form` + `@hookform/resolvers` | 7.88.0 / 5.9.1 | Form state + Zod integration | Booking form, admin availability editor, course-authoring forms — anywhere with real client-side form UX beyond a single field. |
| `date-fns` + `date-fns-tz` | 4.4.0 / 3.2.0 | Timezone-aware date arithmetic | Mandatory per PITFALLS.md Pitfall 14 — store UTC in Postgres, convert to `America/Sao_Paulo` only at display/reminder-offset computation time. Never do raw `Date` math for slot/reminder logic. |
| `resend` | 6.28.1 | Transactional email (student password reset / magic link, purchase receipt) | Email is *not* the notification channel for booking (that's WhatsApp per PROJECT.md) but the student side still needs it for account recovery and payment receipts. Generous free tier (3k/month), first-party React Email template support, trivial Next.js integration. |
| `server-only` | latest | Compile-time guard | Import at the top of every file in the `server/` domain-module tree so accidentally importing server code into a Client Component fails the build instead of leaking secrets/DB access into the browser bundle. |
| `@tanstack/react-query` | 5.103.1 | Client-side data fetching/caching | Optional — only pull this in for genuinely interactive client-side views (e.g., the admin agenda calendar with live updates). Most of the app should lean on Server Components/Server Actions instead of a client cache layer; don't add this by default. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Lint | v10.x — use `next lint`'s bundled config as the base, add project rules on top. |
| Vitest | Unit tests | v5.x — use for the pure-logic modules ARCHITECTURE.md calls out as unit-testable in isolation: slot computation, reminder-offset math, webhook payload parsing. |
| Playwright / `@playwright/test` | End-to-end tests | v1.63.0 — at minimum, cover the two money-critical flows end-to-end: booking + deposit payment, course purchase + video access grant. |
| Prisma Studio | Data inspection GUI | Bundled with Prisma; genuinely useful for the professional/solo-op to self-serve "did this client's payment go through" questions without a support ticket to the developer. |
| `shadcn` CLI | Component scaffolding | v4.21.0 — the CLI package was renamed from `shadcn-ui` to `shadcn`; installing `shadcn-ui` today installs a deprecated/stale package. |

## Installation

```bash
# Core app
npx create-next-app@latest --typescript --tailwind --app --src-dir

# Database / ORM
npm install @prisma/client
npm install -D prisma
npx prisma init

# Auth
npm install better-auth
npm install -D @better-auth/cli   # if using its migration CLI instead of Prisma's

# Payments
npm install mercadopago

# Validation / forms
npm install zod react-hook-form @hookform/resolvers

# Dates
npm install date-fns date-fns-tz

# Email
npm install resend

# Server-code guard
npm install server-only

# UI
npx shadcn@latest init

# Dev dependencies
npm install -D vitest @playwright/test eslint
```

## Payment Gateway Decision: Mercado Pago (prescriptive, not a shrug)

| Criterion | Mercado Pago | Asaas | Pagar.me | Stripe |
|---|---|---|---|---|
| Pix support | Native, first-class; Payment Brick / Pix Brick gives a drop-in embedded Pix-QR checkout component | Native; API-first, generates dynamic Pix QR/charge, more "invoicing tool" shaped than "checkout embed" shaped | Native; strong marketplace/split orientation (built for platforms with many receivers) | Native since ~2022, but Brazil is a secondary market for Stripe's product shape (card-first) |
| Fee on Pix | **0.99% of transaction value, no fixed floor** (0.49% for qualifying new CNPJ sellers over R$15k/mo); settles instantly, no anticipation needed | **R$1.99 flat per Pix charge** (some new-account promos exist and change often — verify at implementation time) | Enterprise-negotiated, marketplace-oriented pricing — worse fit for a single small seller | ~1.99% on Pix per available data — highest of the four |
| Fee shape at this business's ticket sizes | Percentage wins decisively for small tickets: breakeven vs. Asaas's flat fee is ~R$201. Booking deposits (typically well under R$100) are charged constantly — percentage fee keeps that cheap. Course purchases (likely R$150–500+) are occasional — either fee shape is tolerable there. | Flat fee only wins on tickets above ~R$201 — wrong shape for the high-frequency, low-ticket deposit flow that dominates this app's transaction volume | N/A — not competitive at this scale | Highest cost across both transaction types |
| Webhook reliability | Documented retry policy (retries for up to 4 days on non-2xx), well-documented notification/webhook system, large community due to market dominance | Documented webhook system, less community volume than MP | Documented, marketplace-oriented | Industry-reference webhook design, but this advantage doesn't offset the fee/trust gap for a BR-only solo seller |
| SDK/DX | Official `mercadopago` npm SDK (actively maintained, v3.6.1), Checkout Bricks give a pre-built embeddable Pix-QR + card UI (less custom checkout code to write and secure) | REST-first, no pre-built checkout UI components — you build more of the payment UI yourself | REST-first, steeper setup, aimed at platforms not solo sellers | Best-in-class docs in general, but that strength is largely irrelevant when Pix (not cards) is the mandatory rail here |
| Split/escrow | Supported (for future multi-receiver scenarios) | Supported (`docs.asaas.com/docs/split-de-pagamentos`) | Strongest split support of the four — purpose-built for marketplaces | Supported via Connect, but heaviest to set up |
| **Fit for this project** | **Best** — solo operator is a single receiver, so split is irrelevant today; the percentage fee is the right shape for frequent small deposits; Checkout Bricks reduce the amount of custom Pix-QR UI to build and secure; Mercado Pago is also the brand Brazilian consumers most recognize and trust for online Pix, which matters for a small independent business's checkout conversion | Strong runner-up, especially if the business later wants an all-in-one invoicing/CRM tool — but the flat Pix fee is the wrong shape for high-frequency small deposits | Overkill — built for platforms with multiple receivers, which this product explicitly is not (solo operator, no multi-professional split — see PROJECT.md "Out of Scope") | Not recommended as primary — Pix is a secondary feature bolted onto a card-first product; no meaningful DX advantage here given Pix is 100% of this project's payment requirement |

**Decision: Mercado Pago.** Use the Payment Brick (or Pix Brick specifically) for the embedded checkout UI, the Orders/Payments API server-side to create the charge with `external_reference` routing (booking vs. course purchase, per ARCHITECTURE.md's shared-webhook design), and the documented webhook endpoint with signature verification + re-fetch-don't-trust-payload pattern (ARCHITECTURE.md Pattern 3 / PITFALLS.md Pitfall 3–4).

**Split/escrow is a non-issue for v1**, not a gap: this is a solo operator receiving 100% of every transaction into one account. If multi-professional support is ever added post-v1 (explicitly out of scope now), Mercado Pago's split API (or a later migration to Pagar.me) becomes relevant — don't build for it now.

## WhatsApp Provider Decision: Meta Cloud API (official) — with the tradeoff stated plainly

| | Meta WhatsApp Cloud API (official) | Z-API / Evolution API (unofficial) |
|---|---|---|
| Cost | Free platform access; per-template-message billing since July 1, 2025 (moved from per-conversation to per-message), varies by category (Utility/Marketing/Authentication) and recipient country; free-form replies inside an open 24h window are free; utility messages inside an open window are also free | Cheaper — flat monthly fee per instance, no Meta per-message billing |
| Setup friction | Requires a Meta Business Manager, phone number registration, and template pre-approval for any message sent outside a 24h window (which is essentially every reminder, since reminders are sent well ahead of the appointment) | No business verification, no template approval — connect via QR code like WhatsApp Web, live in minutes |
| **Ban risk** | None from Meta's own enforcement — this *is* the sanctioned channel | **Real and reported in the wild.** These providers connect through WhatsApp's consumer-app protocol, which Meta actively detects and bans, in waves, without warning or an appeal path. Community incident reports (Reclame Aqui and others) describe permanent bans triggered by burst-sending — exactly the pattern of "send reminders to everyone with an appointment tomorrow" that this product's core feature requires. |
| **What a ban actually costs this business** | N/A | This is the professional's **only** client-communication number — the one clients already have saved, already trust, already message for questions. A ban doesn't just break the reminder feature; it severs the business's entire existing client relationship channel overnight, with no recovery path except migrating everyone to a new number and absorbing the trust/continuity loss. |

**Decision: Meta WhatsApp Cloud API, official, direct.** The cost and setup friction (business verification, template approval, category classification as "Utility" not "Marketing" so it's both cheaper and less likely to be rejected) are real but bounded and known in advance. The unofficial-provider risk is unbounded and catastrophic specifically *because* this product's automated-reminder feature is exactly the burst-sending pattern that triggers bans, and the number at risk is the professional's sole channel of client trust. This is not a close call for a business-critical, production notification channel — pay the Cloud API's friction cost.

Implementation note: no SDK is required — the Cloud API is plain REST (`POST https://graph.facebook.com/v20.0/{phone-number-id}/messages`); a thin fetch wrapper inside the `notifications` module (per ARCHITECTURE.md) is sufficient and keeps the integration provider-agnostic if a BSP (e.g., 360dialog) is added later for easier Business Manager onboarding assistance.

## Video Hosting Decision: Panda Video

| | Panda Video | Bunny Stream | VdoCipher | Mux |
|---|---|---|---|---|
| Origin / billing | Brazilian company, BRL billing, PT-BR support | International, pure pay-as-you-go, USD | International, USD, per-hour-watched pricing | International, USD, developer-infrastructure-first |
| Entry cost | From ~$0.50/day baseline tier; 14-day free trial with 100GB bandwidth | Storage $0.005/GB, CDN from $0.01/GB — cheapest raw hosting; **DRM is a $99/mo add-on** on top of base hosting | Budget-friendly for dynamic watermarking specifically; DRM included at its tier | $100/mo+ entry point; DRM is an add-on to the broader (pricier) video product |
| Anti-piracy | DRM (Widevine/FairPlay) **+** dynamic watermark burning the viewer's name/email into the video during playback **+** domain allowlisting, bundled together | DRM available but as a paid add-on on top of the cheap base tier — the cheap headline price is not the DRM price | Strong dynamic watermarking specifically marketed at course-piracy prevention | Strong, but aimed at broader video-infrastructure needs (live, on-demand at scale), not course-specific |
| Fit for "área de aluna" | Purpose-built for this exact use case (Brazilian info-product/course creators); 20+ embed options for a member area; simplest path from "buy a course" to "watch a protected lesson" | Best if pure cost matters more than out-of-box anti-piracy, and you're willing to configure DRM as a separate purchase step | Good alternative if watermarking-first (not DRM-first) protection is preferred and USD billing is acceptable | Overkill for a small, non-technical solo course catalog — its strengths (global scale, live streaming) aren't needed here |

**Decision: Panda Video.** For a solo Brazilian course creator with a limited lesson catalog, Panda Video's combination of BRL billing, bundled DRM + dynamic watermark + domain-lock (rather than DRM as a $99/mo bolt-on), and purpose-built "área de membros" embed options make it the most idiomatic and lowest-friction choice. No DRM scheme stops a determined screen-recorder — the point is raising the cost of casual piracy (easy downloads, easy link-sharing) to near zero, which watermarking + domain-lock + signed/expiring embed tokens (ARCHITECTURE.md's "Video Access Grant" pattern) already achieve. Revisit Bunny Stream (cheaper raw hosting) or VdoCipher only if Panda Video's bandwidth costs become a real line item at meaningfully higher course-sales volume than v1 scale.

## Dual Identity Model — how to accommodate both audiences

This is the concrete implementation of ARCHITECTURE.md's "Identity & Auth" component and directly closes PITFALLS.md Anti-Pattern 4 / Pitfall (forcing account creation before booking).

**Booking clients (short transactional flow) — no Better Auth session at all.**
The booking flow collects name + phone (+ optional email) inline, creates a `Client` row, and issues a signed, expiring token (e.g., a JWT or opaque token stored against the appointment) sent to the client via the WhatsApp confirmation message as a "gerenciar meu agendamento" link. That token — not a login — is what lets her reschedule/cancel later. No password, no signup screen, nothing that reintroduces the WhatsApp-era friction this product exists to remove.

**Course students (persistent account) — Better Auth, email/password or magic link.**
Students need a real session that persists across visits (progress tracking, re-watching lessons weeks later), so they get a genuine Better Auth account: `better-auth` + `@prisma/client` via Better Auth's first-party Prisma adapter, session cookie, protected `/area-do-aluna` route group.

**The bridge — same person, two roles, reconciled by contact info, not force-merged upfront.**
Enforce a unique constraint on `Client.phone`/`Client.email` and on the Better Auth `User.email`. When a `Client` (booking-only) later buys a course, checkout uses the same email to either find-or-create the Better Auth `User` and link a `clientId` reference on it — a former lash client becomes a recognized student without ever having been forced through a signup flow she didn't need for booking. This is a real product opportunity, not just an edge case: many booking clients are the exact audience for the "become a lash designer" course.

**Why not Better Auth's `anonymous` plugin for the booking side too, if it exists for this exact pattern?** It was seriously considered — Better Auth ships an `anonymous` plugin precisely for "session now, become a real account later." It's the right tool if the booking flow ever needs its own persisted, cross-visit client dashboard (e.g., "see all my past appointments" without re-entering her phone every time). For v1, the token-link pattern above is simpler (zero session/cookie machinery for a flow that's explicitly supposed to feel account-less) and fully satisfies "ideally no full account required." Revisit the anonymous-plugin approach if a client-facing booking history/dashboard becomes a real requirement later — the two approaches aren't mutually exclusive; Better Auth would already be in the stack for students.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Next.js monolith | Separate React SPA + Express/Nest API | Never at this project's scale — reconsider only if a native mobile app and the web app need to share one backend, or if the team grows large enough to need decoupled release cadences |
| Prisma | Drizzle ORM | If deploying to a strict edge runtime (Cloudflare Workers) where bundle size is a hard constraint, or if the team strongly prefers SQL-shaped queries over a generated client — neither applies to a Vercel-hosted Node runtime app here |
| Better Auth | NextAuth / Auth.js v5 | Once Auth.js v5 reaches a stable (non-beta) release with a track record — as of this research it's still `5.0.0-beta.32` after over a year, not the right foundation for a payments-adjacent production app today |
| Better Auth | Clerk / Supabase Auth (hosted) | If the team wants a fully hosted auth UI/dashboard and is fine with a per-MAU pricing model once past the free tier — reasonable alternatives, but Better Auth avoids a second vendor dependency and keeps auth logic in-repo, which fits a solo dev who already owns the whole Prisma schema |
| Mercado Pago | Asaas | If the business evolves into needing recurring billing/invoicing/dunning workflows beyond one-off deposits and course purchases, or if average ticket size consistently exceeds ~R$200 (where Asaas's flat Pix fee starts beating Mercado Pago's percentage) |
| Mercado Pago | Pagar.me | Only if/when multi-professional support is added and real split-payment-to-multiple-receivers becomes a requirement — explicitly out of scope for v1 |
| Meta Cloud API | Z-API / Evolution API | Only as a genuinely disposable, non-primary number for early internal testing — never for the production number clients already know, per the ban-risk analysis above |
| Panda Video | Bunny Stream | If bandwidth costs at scale outweigh the value of bundled DRM+watermark, and the team is comfortable configuring DRM as a separate purchase/integration step |
| Vercel | Railway / Render | If the app splits into a real separate backend service later (see monolith decision) — Railway is reasonable for a solo-dev backend, but Vercel is the better fit for the monolith recommended here |
| Vercel Cron | Inngest / Trigger.dev | If reminder/webhook-retry logic grows into genuinely long-running, multi-step workflows needing automatic retries/observability beyond "poll a table every few minutes" — not justified at this project's volume, but a natural next step to layer on top of (not replace) Vercel Cron if it's ever needed |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Z-API, Evolution API, Baileys-based unofficial WhatsApp providers for the production number | Real, reported permanent-ban risk triggered by exactly the burst-reminder-sending pattern this product needs; a ban severs the business's only client channel with no appeal path | Meta WhatsApp Cloud API (official), accepting the setup/approval friction |
| NextAuth / Auth.js v5 as the primary auth library today | Still in beta (`5.0.0-beta.32`) after 1+ year with no stable release — not a sound foundation for a payments-adjacent production app | Better Auth 1.7.5 (stable) |
| Stripe as the primary/only payment gateway | Pix is the mandatory rail for both flows; Stripe's Pix support is a bolt-on to a card-first product with a higher effective fee than Mercado Pago and none of the local-market checkout-trust or Brick-component advantages | Mercado Pago |
| A separate Express/Nest API service alongside the Next.js frontend | Doubles hosting/CI/deploy surface for zero benefit at this traffic/team size; the repo's empty `client/`/`server/` folders should not be read as a commitment to this | Next.js monolith with `server/`-as-internal-module-tree, not `server/`-as-separate-service |
| Hotmart/Kiwify (or any external course platform) for lesson delivery | Explicitly out of scope per PROJECT.md — the student area must be part of the product itself, not outsourced | Panda Video for storage/streaming/DRM only, embedded inside the product's own `/area-do-aluna` |
| Raw S3 + CloudFront hand-rolled signed URLs for video | Assembling HLS packaging, Key Groups, and signed-cookie rotation from scratch is real infrastructure work with no course-specific tooling (no watermarking, no course-creator dashboard) for a solo dev to maintain | Panda Video (or Bunny Stream/VdoCipher as alternatives) — purpose-built, managed |
| `shadcn-ui` npm package | Deprecated/renamed — installing it today gets a stale package | `shadcn` (current CLI package name) |
| Vercel Hobby plan for the production deployment | ToS prohibits commercial/for-profit use; also hard-caps Cron to once/day, which breaks timely reminder dispatch | Vercel Pro ($20/mo) |
| Trusting the payment gateway's webhook payload or the client browser redirect as proof of payment | Root cause of PITFALLS.md Pitfall 3/4 — spoofable, replayable, and not how any of the compared gateways guarantee state | Webhook triggers a server-side re-fetch of authoritative payment status via the gateway's API (ARCHITECTURE.md Pattern 3) |

## Stack Patterns by Variant

**If course-sales volume grows enough that video bandwidth becomes a real line item:**
- Move to Bunny Stream (cheaper raw bandwidth) with DRM configured as its paid add-on, or renegotiate a Panda Video plan tier.
- Because Panda Video's convenience/bundling advantage matters most at low-to-moderate volume; at real scale, raw bandwidth cost dominates the decision.

**If multi-professional support is ever added (explicitly out of scope for v1, per PROJECT.md):**
- Revisit Pagar.me (or Mercado Pago's own split API) for real split-payment-to-multiple-receivers.
- Because split/escrow is a non-requirement today (single receiver) and shouldn't shape the v1 gateway choice — but the schema already carries a `professional_id`-shaped concept per ARCHITECTURE.md, so the payment-split migration wouldn't require a data model rewrite.

**If reminder/notification logic grows into genuinely long-running, retryable, multi-step workflows:**
- Layer Inngest on top of (not instead of) Vercel Cron — Cron becomes the trigger, Inngest becomes the durable-execution layer.
- Because a simple DB-polled table is sufficient at this project's volume (per ARCHITECTURE.md's own scaling table), and introducing a workflow engine before it's needed is unjustified complexity for a solo dev to operate.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `next@16.3.5` | `react@19.3.0` / `react-dom@19.3.0` | Next.js 16's peer range is `^18.2.0 \|\| ^19.0.0`; use 19.x for Server Components performance — don't mix a React 18 app with Next 16. |
| `prisma@7.10.0` | `@prisma/client@7.10.0` | Keep CLI and client versions in lockstep; Prisma 7 replaced the native Rust engine with TS/WASM, so no native binary to worry about on serverless. |
| `better-auth@1.7.5` | `@prisma/client` (via Better Auth's Prisma adapter) | Better Auth generates its own schema additions via its CLI (`npx @better-auth/cli generate`) — run this after any Better Auth plugin change and re-run `prisma migrate`. |
| `tailwindcss@4.3.3` | Next.js 16 App Router | Tailwind v4 uses CSS-first config (`@theme` in CSS, no `tailwind.config.js` by default) — don't paste v3-era config-file tutorials verbatim. |
| `zod@4.6.5` | `@hookform/resolvers@5.9.1` | Resolvers v5 line supports Zod v4's new API surface; don't pin an older resolvers version against Zod 4. |
| `mercadopago@3.6.1` (Node SDK) | Node.js 20+ | Matches Next.js 16's own minimum Node engine (`>=20.9.0`) — no separate runtime constraint introduced. |

## Sources

- npm registry (`registry.npmjs.org`) — direct version verification for `next`, `react`, `prisma`, `@prisma/client`, `drizzle-orm`, `next-auth`, `@auth/core`, `better-auth`, `mercadopago`, `stripe`, `tailwindcss`, `zod`, `typescript`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, `date-fns-tz`, `resend`, `shadcn` — HIGH (authoritative, current at time of research)
- Mercado Pago Developers — Pix integration & webhook/notification docs (mercadopago.com.br/developers) — HIGH (official)
- Asaas — official pricing page (asaas.com/precos-e-taxas) and split-payment docs (docs.asaas.com/docs/split-de-pagamentos) — HIGH (official)
- Pagar.me — official split/marketplace docs (docs.pagar.me) — HIGH (official)
- Meta for Developers — WhatsApp Business Platform pricing (developers.facebook.com/documentation/business-messaging/whatsapp/pricing) — HIGH (official)
- AraraHQ — "API WhatsApp Oficial vs Não-Oficial: Os Riscos Reais de Banimento" — MEDIUM (industry blog, cross-checked against Reclame Aqui incident reports)
- Reclame Aqui — Z-API ban complaints — MEDIUM (consumer complaint platform, anecdotal but consistent with other sources)
- Panda Video — official pricing/anti-download pages (pandavideo.com/pricing, pandavideo.com/br/funcionalidades/anti-download) — HIGH (official)
- Bunny Stream / VdoCipher / Mux — third-party comparison articles on DRM pricing (Gumlet's "Video DRM Cost in 2026") — MEDIUM (aggregated industry pricing, not each vendor's own page — verify exact current tier pricing before committing)
- Better Auth — official docs, `anonymous` plugin page (better-auth.com/docs/plugins/anonymous) — HIGH (official)
- Vercel — official docs on regional pricing (gru1), plan limits, and Cron Jobs frequency by plan (vercel.com/docs) — HIGH (official)
- Devblogs Microsoft — "Announcing TypeScript 7.0" — HIGH (official, primary source for the TS7 GA claim)
- Encore/Bytebase/Makerkit Prisma-vs-Drizzle comparison articles (2026) — MEDIUM (third-party but broadly consistent with each other and with Prisma's own 7.0 release notes)

---
*Stack research for: solo beauty-professional booking + recorded-course platform (Brazilian market)*
*Researched: 2026-09-18*
