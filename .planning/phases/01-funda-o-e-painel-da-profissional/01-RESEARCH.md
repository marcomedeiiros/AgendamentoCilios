# Phase 1: Fundação e Painel da Profissional - Research

**Researched:** 2026-09-18
**Domain:** Next.js 16 monolith scaffolding, dual-identity auth foundation (Better Auth), admin route protection, service-catalog soft-delete schema, availability-rules schema, LGPD baseline
**Confidence:** HIGH (scaffolding commands, package versions, Next.js 16 middleware→proxy rename, Prisma/Better Auth CLI drift — all verified against the live npm registry and official docs this session); MEDIUM (Better Auth admin-plugin exact option names, LGPD content checklist — official docs fetched but summarized by an intermediate model, not read verbatim); LOW/ASSUMED (day-of-week numbering convention, exact privacy-policy legal text — these need business/legal sign-off, not just engineering judgment)

## Summary

Phase 1 has no CONTEXT.md, so this research treats PROJECT.md's Key Decisions table and the three project-level research documents (STACK.md, ARCHITECTURE.md, PITFALLS.md) as locked. Nothing here re-opens the monolith-vs-split call, the Next.js/Prisma/Better Auth/Mercado Pago/Meta/Panda Video choices, or the phone-token vs. Better-Auth-anonymous-plugin decision for booking clients — those are settled. This document answers the one question those documents leave open at the "how do I actually build this" level: the concrete scaffolding commands, the concrete Prisma schema for the dual-identity model, the concrete admin route-protection pattern for the *current* Next.js version, and the concrete shape of the service-catalog and availability-rules tables.

Two verified, time-sensitive corrections to STACK.md surfaced this session and must flow into the plan: (1) Next.js 16 renamed `middleware.ts` to `proxy.ts` (exported function `proxy`, not `middleware`) and moved its runtime from Edge back to Node.js — STACK.md predates this being load-bearing for Phase 1's admin-gating task, so the plan must use `proxy.ts`, not `middleware.ts`. (2) `npm view prisma version` today resolves the `latest` dist-tag to `8.0.0-rc.15`, a release candidate — running `npm install -D prisma` unpinned would install a version mismatched with `@prisma/client@7.10.0` (whose `latest` tag is still 7.10.0). Both packages must be pinned explicitly to `7.10.0`. Separately, `@better-auth/cli` (STACK.md's installation snippet) is now a **deprecated** package on the registry; the replacement is the `auth` CLI package (`npx auth@latest generate` / `migrate` / `create-admin`), confirmed to share Better Auth's own repo and version line (1.7.5).

The highest-leverage decision in this phase is the identity schema. STACK.md's "Dual Identity Model" section already made the call (booking clients get no Better Auth session at all — a signed link token instead; students and the professional get real Better Auth accounts, bridged by a nullable `clientId` on `User`). This research turns that into a concrete Prisma schema: a `User` table carrying Better Auth's required fields plus a `role` field (via the `admin` plugin) and an optional one-to-one link to a separate `Client` table, so a booking-only `Client` row created in Phase 2 can later be linked to a `User` row in Phase 5 without ever duplicating the person's name/phone/email.

**Primary recommendation:** Scaffold one Next.js 16 app at the repo root (not into a nested folder), keep the existing empty `server/` directory as the internal domain-module tree and repurpose `client/` away entirely (its role — routes + UI — is `app/` + `components/`), wire Better Auth's `admin` plugin with a `role` field for the single professional account seeded via `npx auth@latest create-admin`, protect `/admin` with a `proxy.ts` check backed by a second, independent session check inside the admin layout/Server Actions (defense-in-depth per the CVE-2025-29927 lesson), and model `Service.active` (boolean, not delete) plus explicit note that Phase 2's `Appointment` model must snapshot price/duration rather than reading live `Service` fields.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| IDEN-06 | Profissional acessa o painel administrativo com credenciais próprias | Pattern 2 (two-layer admin gating) + Pattern 3 (Better Auth `admin` plugin, single hardcoded professional) + "Seeding the Professional Account" code example |
| SERV-01 | Profissional cadastra um serviço com nome, descrição, duração e preço | Pattern 4 (Service schema) + Pattern 5 (money as integer cents) |
| SERV-02 | Profissional edita e desativa serviços sem apagar o histórico de agendamentos | Pattern 4 (`active` boolean, never hard-delete; price/duration snapshot boundary documented for Phase 2) + Pitfall 2 |
| SERV-03 | Profissional define o valor fixo do sinal exigido para reservar | Pattern 4 (`depositCents` field) + Pattern 5 |
| SERV-04 | Cliente vê a lista de serviços ativos com duração e preço antes de escolher | Architectural Responsibility Map (public catalog = Frontend Server, direct filtered Prisma read) + Pattern 4 |
| AVAIL-01 | Profissional define seus horários de trabalho por dia da semana | Pattern 6 (`WorkingHourRule` — recurring civil time, `@db.Time`) |
| AVAIL-02 | Profissional bloqueia datas e períodos específicos | Pattern 6 (`AvailabilityBlock` — `@db.Timestamptz`, specific calendar instants) |
| AVAIL-03 | Profissional define tempo de intervalo entre atendimentos | Pattern 6 (`SchedulingSettings.bufferMinutes`) |
| AVAIL-04 | Profissional define antecedência mínima e até quando a agenda fica aberta | Pattern 6 (`SchedulingSettings.minLeadTimeMinutes` / `bookingHorizonDays`) |
| POL-03 | Site publica política de privacidade descrevendo dados coletados, finalidade e retenção | Pitfall 4 (privacy-policy content/scope guidance) + Assumption A3 |
| POL-04 | Sistema coleta apenas os dados necessários a cada etapa e não armazena dados de cartão | Security Domain (V5 Input Validation — Zod `.strict()` at every Server Action boundary) + Don't Hand-Roll (money as integer cents, no card data anywhere in this phase's scope) |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Professional admin authentication | API / Backend (Better Auth + Prisma) | Frontend Server (session cookie read in layout) | Better Auth issues/validates the session server-side; the layout reads it to decide render vs. redirect — this is a monolith, so "API" and "Frontend Server" are the same Next.js process, but the responsibility split still matters for where checks live |
| Admin route gating (`/admin/*`) | Frontend Server (`proxy.ts` + admin layout) | API / Backend (Server Action re-check) | Per Next.js 16's own guidance (see Pitfall/CVE section below): proxy is a coarse first gate, not the source of truth — every Server Action under `/admin` must re-verify the session independently |
| Service catalog CRUD (SERV-01..03) | API / Backend (Server Actions + Prisma) | Database (Postgres via Prisma) | Admin-authored data; no public write path |
| Public service catalog listing (SERV-04) | Frontend Server (Server Component, direct Prisma read) | — | No separate API layer needed in a monolith; a Server Component queries Postgres directly, filtered `WHERE active = true` |
| Availability rules CRUD (AVAIL-01..04) | API / Backend (Server Actions + Prisma) | Database | Same pattern as service catalog; pure admin-authored configuration, no slot computation in this phase |
| Privacy policy page (POL-03) | Frontend Server (static/SSR content route) | — | No dynamic data; a plain route under `app/(public)/` |
| Data-minimization enforcement (POL-04) | API / Backend (Zod schemas at the Server Action boundary) | — | Enforced once, at the single ingress point every mutation passes through — not duplicated per-form |

## Project Constraints (from CLAUDE.md)

No `./CLAUDE.md` exists in the repo root. `./.claude/CLAUDE.md` exists but is the GSD-generated aggregate file (stack/architecture/conventions sections pulled from `.planning/research/*` — already covered above — plus a generic "route file changes through a GSD command" workflow note that governs *how the repo is edited*, not what gets built). It contains no project-specific coding conventions, forbidden patterns, or security requirements beyond what STACK.md/ARCHITECTURE.md/PITFALLS.md already establish. No project skills directory (`.claude/skills/`, `.agents/skills/`, etc.) exists yet. Nothing here constrains this phase's technical content beyond the locked decisions already covered.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 16.3.5 | Full-stack framework | Locked in STACK.md; `latest` dist-tag confirmed 16.3.5 today `[VERIFIED: npm registry]` |
| React / React DOM | 19.3.0 | UI runtime | Required peer of Next 16; confirmed current `[VERIFIED: npm registry]` |
| TypeScript | 7.0.2 | Type safety | Confirmed current `[VERIFIED: npm registry]` |
| Prisma CLI | **7.10.0 — must be pinned explicitly** | ORM/migrations | `[VERIFIED: npm registry]` — see "Version Corrections" below; do not install unpinned |
| `@prisma/client` | 7.10.0 | Generated query client | `[VERIFIED: npm registry]`, matches Prisma CLI when both pinned |
| `better-auth` | 1.7.5 | Auth core | `[VERIFIED: npm registry]` |
| `auth` (CLI) | 1.7.5 | Better Auth's schema-generation/admin-bootstrap CLI | `[VERIFIED: npm registry]` — replaces deprecated `@better-auth/cli`, see below |
| `zod` | 4.6.5 | Server Action input validation | `[VERIFIED: npm registry]` |
| `tailwindcss` | 4.3.3 | Styling | `[VERIFIED: npm registry]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-hook-form` + `@hookform/resolvers` | 7.88.0 / 5.9.1 | Form state + Zod bridge | Service form, availability-rule form — anywhere with more than a single field and real client-side UX |
| `date-fns` + `date-fns-tz` | 4.4.0 / 3.2.0 | Timezone-aware date arithmetic | Any place a working-hour or block is displayed/edited; not needed for slot math yet (that's Phase 2) but the admin availability form should already validate using these, not raw `Date` math |
| `server-only` | 0.0.1 | Compile-time guard | Top of every file in `server/modules/**` |
| `shadcn` (CLI) | 4.21.0 | Component scaffolding | `npx shadcn@latest init` — never `shadcn-ui`, confirmed deprecated |

### Version & CLI Corrections (time-sensitive, verified this session — supersede STACK.md's installation snippet)

| STACK.md said | What the registry says today (2026-09-18) | Action |
|---|---|---|
| `npm install @prisma/client` / `npm install -D prisma` (implicitly lockstep at 7.10.0) | `npm view prisma dist-tags` shows `latest: 8.0.0-rc.15` (a release candidate); `prev: 7.10.0`. `@prisma/client`'s `latest` is still `7.10.0`. `[VERIFIED: npm registry]` | Pin both explicitly: `npm install -D prisma@7.10.0` and `npm install @prisma/client@7.10.0`. An unpinned install today pulls a Prisma 8 RC CLI against a Prisma 7 client — a real break, not a hypothetical one. |
| `npm install -D @better-auth/cli` | `npm view @better-auth/cli deprecated` returns `"Package no longer supported."` `[VERIFIED: npm registry]` | Use the `auth` package instead: `npm install -D auth` (or invoke via `npx auth@latest ...` without installing). Commands: `npx auth@latest generate` (schema generation), `npx auth@latest migrate`, `npx auth@latest create-admin --email ... --name ... --role admin` (bootstraps the professional account — see "Seeding the Professional Account" below). `[CITED: better-auth.com/docs/plugins/admin]` |

**Installation (Phase 1 scope only — payments/WhatsApp/video packages are later phases):**
```bash
# Scaffold (see "Project Scaffolding" section for placement details)
npx create-next-app@latest . --typescript --tailwind --eslint --app --import-alias "@/*" --disable-git

# Database / ORM — pin explicitly, do not trust `latest`
npm install @prisma/client@7.10.0
npm install -D prisma@7.10.0
npx prisma init --datasource-provider postgresql

# Auth
npm install better-auth
npm install -D auth   # replaces deprecated @better-auth/cli

# Validation / forms
npm install zod react-hook-form @hookform/resolvers

# Dates
npm install date-fns date-fns-tz

# Server-code guard
npm install server-only

# UI
npx shadcn@latest init

# Dev dependencies
npm install -D vitest @playwright/test
```

### Alternatives Considered

None re-opened — STACK.md's comparisons (Better Auth vs. Auth.js, Prisma vs. Drizzle, etc.) already cover this ground and are not revisited here.

## Package Legitimacy Audit

| Package | Registry | Age (latest publish) | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-----------------------|--------------|--------------|---------|-------------|
| next | npm | 2026-09-11 | 53M | github.com/vercel/next.js | SUS (`too-new`) | **Contextual OK** — heuristic flags the latest *version's* publish date, not package age; 53M weekly downloads and an official Vercel repo make this an unambiguous false positive. No checkpoint needed. |
| react / react-dom | npm | 2026-09-09 | 160M / 151M | github.com/react/react | SUS (`too-new`) | **Contextual OK** — same false-positive pattern, 150M+/wk downloads |
| prisma | npm | 2026-09-14 | 15.5M | github.com/prisma/prisma-cli | SUS (`too-new`) | **Contextual OK**, but see Version Corrections table — pin to `7.10.0`, not `latest` |
| @prisma/client | npm | 2026-08-25 | 14.9M | github.com/prisma/prisma | SUS (`too-new`) | **Contextual OK** — pin to `7.10.0` |
| better-auth | npm | 2026-09-14 | 7.6M | github.com/better-auth/better-auth | SUS (`too-new`) | **Contextual OK** |
| zod | npm | 2026-09-13 | 264M | github.com/colinhacks/zod | SUS (`too-new`) | **Contextual OK** |
| react-hook-form | npm | 2026-09-11 | 51.8M | github.com/react-hook-form/react-hook-form | SUS (`too-new`) | **Contextual OK** |
| vitest | npm | 2026-09-15 | 94.5M | github.com/vitest-dev/vitest | SUS (`too-new`) | **Contextual OK** |
| @playwright/test | npm | 2026-09-04 | 56.4M | github.com/microsoft/playwright | SUS (`too-new`) | **Contextual OK** |
| eslint | npm | 2026-09-18 | 143M | github.com/eslint/eslint | SUS (`too-new`) | **Contextual OK** |
| shadcn | npm | 2026-09-04 | 8.6M | github.com/shadcn-ui/ui | SUS (`too-new`) | **Contextual OK** |
| server-only | npm | 2022-09-03 | 16M | none listed in registry metadata | SUS (`no-repository`) | **Contextual OK** — single-purpose Vercel-authored guard package with no separate repo field by design; 16M weekly downloads, ships from the Next.js org |
| typescript, @hookform/resolvers, tailwindcss, date-fns, date-fns-tz | npm | various | 9M–253M | official repos | OK | Approved |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** all flagged items above are `too-new` (heuristic reads the *latest published version's* date, not package age) or `no-repository` (a known quirk of `server-only`'s minimal package.json). Every flagged package has an official, well-known source repo and download counts in the tens-to-hundreds of millions per week — none require a `checkpoint:human-verify` gate. The one item that *does* need explicit action is the `prisma`/`@prisma/client` version-pin issue captured in the Version Corrections table above (not a legitimacy issue — a version-drift issue).

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER (client + admin)                     │
│   público: /  /servicos  /politica-de-privacidade                │
│   admin:   /admin/login  /admin/servicos  /admin/disponibilidade │
└───────────────────────────┬────────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 proxy.ts  (coarse gate, Node runtime)             │
│   if path starts with /admin and no session cookie → redirect    │
│   NOT the source of truth — see CVE-2025-29927 pitfall below     │
└───────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    app/(admin)/layout.tsx                        │
│   await auth.api.getSession(...) — SECOND, authoritative check   │
│   role !== "admin" → redirect (this is the real gate)            │
└───────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Server Actions ("use server", in app/)               │
│   createService · updateService · deactivateService               │
│   createWorkingHourRule · createAvailabilityBlock                 │
│   each: re-check session/role (3rd check) → zod.parse(input)      │
└───────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          server/modules/{identity,catalog,availability}/          │
│   pure domain logic, imports "server-only", calls Prisma           │
└───────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Prisma Client)                     │
│   User · Session · Account · Verification (Better Auth)           │
│   Client (booking-lite, Phase 2 writes to it)                     │
│   Service · WorkingHourRule · AvailabilityBlock · SchedulingSettings│
└─────────────────────────────────────────────────────────────────┘

Public catalog read path (no auth):
Browser → app/(public)/servicos/page.tsx (Server Component)
        → Prisma: SELECT * FROM Service WHERE active = true
        → rendered list (no admin fields exposed)
```

### Recommended Project Structure

The existing repo root has `.git/`, `.claude/`, `.planning/`, `README.md`, and two **empty** placeholder directories (`client/`, `server/`). Scaffold in place, at the repo root — do not nest a new project folder inside it.

```
/  (repo root — existing .git, .planning, README.md stay untouched)
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # landing
│   │   ├── servicos/page.tsx           # SERV-04 — public catalog
│   │   └── politica-de-privacidade/page.tsx  # POL-03
│   ├── (admin)/
│   │   ├── layout.tsx                  # authoritative session+role check
│   │   ├── login/page.tsx
│   │   ├── servicos/page.tsx           # SERV-01..03 CRUD UI
│   │   └── disponibilidade/page.tsx    # AVAIL-01..04 CRUD UI
│   ├── api/auth/[...all]/route.ts      # Better Auth handler mount point
│   └── layout.tsx
├── components/                          # shared UI (shadcn output lands here)
├── server/                              # EXISTING empty dir, repurposed — never imported by client components
│   ├── modules/
│   │   ├── identity/                    # Better Auth config, role helpers
│   │   ├── catalog/                     # Service CRUD, Zod schemas
│   │   ├── availability/                # WorkingHourRule/Block CRUD, Zod schemas
│   │   └── shared/                      # Prisma client singleton, server-only guard
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                          # bootstraps the one professional User
├── proxy.ts                             # Next.js 16 name — NOT middleware.ts
└── tests/
    ├── unit/                            # Vitest — Zod schemas, module logic
    └── e2e/                             # Playwright — admin login, catalog visibility
```

**What happens to the empty `client/` directory:** per STACK.md's own framing, `client/`'s intended role (routes + UI) is fully absorbed by `app/` + `components/` at the repo root — there is no reason to keep an empty, unused top-level `client/` folder alongside a populated `app/`. Recommend `git rm -r client/` (it is empty; nothing is lost) as a Wave 0 cleanup task, so the directory structure the repo actually has matches the one the architecture documents describe, instead of leaving a stale, confusing placeholder next to the real thing.

### Pattern 1: Scaffold into the existing repo root without fighting git/planning files

**What:** `create-next-app` refuses (or prompts unexpectedly) in a non-empty directory, and this repo root has `.git/`, `.claude/`, `.planning/`, `README.md` already in it. `[CITED: github.com/vercel/next.js/issues/46651, github.com/vercel/next.js/issues/62494]`
**When to use:** This exact situation — first scaffolding commit into an existing greenfield-but-not-empty repo.
**Recommended approach:**
```bash
# Run at repo root, target "." explicitly, disable the CLI's own git init
# (the repo is already a git repo — a second `git init` is unnecessary and
#  the CLI's non-interactive git handling is the documented friction point)
npx create-next-app@latest . \
  --typescript --tailwind --eslint --app \
  --import-alias "@/*" --disable-git
```
If the CLI still complains about existing files (it inspects for conflicting filenames like `package.json`, not general directory contents), fall back to the documented safe path: scaffold into a throwaway sibling folder, then move the generated `app/`, `public/`, `next.config.ts`, `tsconfig.json`, `package.json`, `.eslintrc*` into the repo root, then delete the throwaway folder. Either path is fine; the throwaway-folder path is more predictable because it never touches the existing `.git/`.
**Do not use `--src-dir`.** Skipping it keeps `app/` at the repo root, symmetric with the existing (repurposed) `server/` directory — using `--src-dir` would put routes under `src/app/` while domain modules stay at top-level `server/`, an inconsistent nesting that has no benefit at this project's size.

### Pattern 2: Two-layer admin gating (proxy.ts + layout/Server Action), not proxy.ts alone

**What:** Next.js 16 renamed `middleware.ts` → `proxy.ts` (exported function renamed `middleware` → `proxy`) and changed its runtime from Edge to Node.js. `[CITED: nextjs.org/docs/messages/middleware-to-proxy, via dev.to/beyondit — Next.js 16.1 migration guide]` Separately, and independently of the rename, CVE-2025-29927 (fixed in Next 14.2.25/15.2.3, predates 16 but the lesson is now baked into official guidance) demonstrated that a crafted `x-middleware-subrequest` header could bypass middleware-based auth entirely. `[CITED: cyber.gov.au CVE-2025-29927 advisory; offsec.com CVE-2025-29927 writeup]` The current recommended pattern is explicit defense-in-depth: proxy/middleware is a coarse, fast-reject gate — never the only check.
**When to use:** Every route under `/admin`.
**Example:**
```typescript
// proxy.ts (repo root — NOT middleware.ts)
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has("better-auth.session_token");
  if (request.nextUrl.pathname.startsWith("/admin") && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
```
```typescript
// app/(admin)/layout.tsx — the AUTHORITATIVE check, re-verifies role server-side
import { auth } from "@/server/modules/identity/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/admin/login");
  }
  return <>{children}</>;
}
```
```typescript
// every admin Server Action re-checks independently — a THIRD check, not redundant
"use server";
import { auth } from "@/server/modules/identity/auth";
import { headers } from "next/headers";

export async function deactivateService(serviceId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");
  // ... proceed
}
```
`[CITED: better-auth.com/docs/plugins/admin — session/role check pattern]`

### Pattern 3: Better Auth `admin` plugin, single hardcoded professional

**What:** Better Auth's `admin` plugin adds a `role` column to `User` (default `"user"`), plus ban/impersonate/session-management server APIs. Restrict admin capability to the one professional either via `adminRoles: ["admin"]` (role-based, what's recommended below) or `adminUserIds: [...]` (id-based, more brittle — breaks if the row is ever recreated). `[CITED: better-auth.com/docs/plugins/admin]`
**When to use:** IDEN-06 — the professional's own login.
**Example:**
```typescript
// server/modules/identity/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "../shared/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [admin({ adminRoles: ["admin"] })],
});
```
Bootstrap the one professional account (see "Seeding the Professional Account" below) with `role: "admin"`; every future Phase 5 student signs up through the normal flow and gets the plugin's default `role: "user"` — no code path exists for a student to become admin.

### Pattern 4: Service catalog with price/duration snapshot boundary (SERV-02)

**What:** `Service` is the editable "price tag" the professional maintains. Phase 2's `Appointment` model (not built in this phase) must NOT read `Service.priceCents`/`durationMinutes` live at render/report time — it must copy those values onto the `Appointment` row itself at booking time, so a later price edit never rewrites history. `[CITED via WebSearch: "OrderItem.price is a snapshot... Product.price is a price tag" — dev.to Prisma e-commerce backend pattern]`
**When to use:** Any time a Service's price/duration is edited after appointments referencing it exist (Phase 2+).
**What Phase 1 must do concretely:** model `Service.active` as a boolean toggle (SERV-02's "desativar"), never a hard delete — so a deactivated service's historical FK references (once Phase 2 adds them) stay valid. Document the snapshot requirement inline in the schema as a comment for whoever builds Phase 2's `Appointment` model, so the mistake (reading live `Service` fields for historical display) isn't made once real bookings exist.
```prisma
model Service {
  id              String   @id @default(cuid())
  name            String
  description     String?
  durationMinutes Int
  priceCents      Int      // money as integer cents — see "Money" pattern below
  depositCents    Int      // SERV-03 — fixed sinal value
  active          Boolean  @default(true) // SERV-02/04 — never hard-delete a Service
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  // Phase 2 note: Appointment must snapshot serviceName/durationMinutes/priceCents/
  // depositCents onto itself at creation time — do not FK-read these fields for
  // historical display once appointments exist against this Service.
}
```

### Pattern 5: Money as integer cents, not Prisma `Decimal`/Postgres `money`

**What:** Postgres's native `money` type is locale-dependent and explicitly discouraged for this reason; `Decimal`/`numeric` works but adds a `Decimal.js`-wrapped value type through the whole codebase for values that are always exact BRL cents with no fractional-cent requirement. `[CITED: crunchydata.com/blog/working-with-money-in-postgres; prisma.io/dataguide/postgresql/introduction-to-data-types; PostgreSQL 18 docs §8.2]`
**When to use:** `priceCents`, `depositCents` on `Service`; will extend to `Appointment`/`Payment` in later phases.
**Recommendation:** plain `Int` storing integer cents (R$ 50,00 → `5000`). Simpler than `Decimal` for a single-currency (BRL-only) product with no currency-conversion need, and avoids the Prisma-Decimal serialization gotchas the WebSearch results flagged (`@db.Money` formatting issues reported against Prisma). Format to `R$ X,XX` only at display time.

### Pattern 6: Availability rules — recurring civil time vs. one-off calendar instants

**What:** AVAIL-01 (weekly working hours) is a *recurring rule with no specific date* — "toda segunda, 09:00–18:00" repeats indefinitely and has no instant to convert to UTC. AVAIL-02 (date/period blocks) *is* tied to a specific calendar date — "15 de outubro, dia todo" is one concrete occurrence. These need different Postgres types. `[CITED: bytebase.com/reference/postgres/how-to/how-to-store-time-postgres — "use TIMESTAMPTZ unless you have a specific reason to store wall-clock time, like a recurring alarm"]`
**When to use:** Designing `WorkingHourRule` vs. `AvailabilityBlock`.
```prisma
model WorkingHourRule {
  id        String   @id @default(cuid())
  dayOfWeek Int      // 0=Sunday..6=Saturday (JS Date.getDay() convention — document this everywhere it's read)
  startTime DateTime @db.Time  // wall-clock, no date, no tz — recurs every week
  endTime   DateTime @db.Time
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AvailabilityBlock {
  id        String    @id @default(cuid())
  startsAt  DateTime  @db.Timestamptz  // a real, specific calendar instant
  endsAt    DateTime  @db.Timestamptz
  reason    String?
  createdAt DateTime  @default(now())
}

model SchedulingSettings {
  id                 String   @id @default(cuid())   // singleton row — always id="singleton"
  bufferMinutes      Int      @default(0)             // AVAIL-03
  minLeadTimeMinutes Int      @default(0)             // AVAIL-04 (lower bound)
  bookingHorizonDays Int      @default(30)             // AVAIL-04 (upper bound)
  updatedAt          DateTime @updatedAt
}
```
**Why this doesn't make Phase 2 painful:** Phase 2's slot-computation function (ARCHITECTURE.md Pattern 1) already expects to work "in America/Sao_Paulo civil time" for working windows and convert to `tstzrange` only for the actual `Appointment` row — this schema shape hands it exactly that split, pre-made. Since Brazil abolished DST in 2019 and this product is Brazil-only (per PROJECT.md), a fixed `America/Sao_Paulo` (UTC-3) interpretation of `WorkingHourRule`'s wall-clock time is safe without a stored per-rule timezone column — `[ASSUMED]`, flagged in the Assumptions Log because "Brazil-only, no DST" is a product-scope fact from PROJECT.md, not something this session independently verified against current Brazilian law.
**`dayOfWeek` numbering — `[ASSUMED]`:** recommending JS `Date.prototype.getDay()` convention (0=Sunday) because Phase 2's slot logic will almost certainly compute against native `Date`/`date-fns`, and matching that library's own day-index convention avoids an off-by-one translation layer. This is an engineering default, not sourced from a single authority — confirm with the planner/discuss-phase before treating it as locked, since ISO 8601 (1=Monday) is an equally common alternative and Brazilian business convention often starts the week on Monday colloquially.

### Anti-Patterns to Avoid

- **Treating `proxy.ts` as the sole admin gate:** exactly the CVE-2025-29927 lesson — a header-spoofing bypass class exists for this pattern; always re-check in the layout and in each Server Action.
- **Using `Decimal`/`@db.Money` for BRL cents in a single-currency app:** adds `Decimal.js` value-wrapping complexity and known Prisma formatting issues for no benefit when integer cents suffice.
- **Storing `WorkingHourRule` times as `timestamptz`:** a recurring Monday rule has no "instant" — forcing it into `timestamptz` invites a silent UTC-conversion bug the moment anyone reads it naively.
- **Hard-deleting a `Service` row on "desativar":** breaks SERV-02's own requirement the moment Phase 2 adds a FK to it.
- **Installing `prisma` without pinning the version today:** pulls a Prisma 8 release-candidate CLI mismatched against a Prisma 7 client.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing / session tokens | Custom bcrypt+JWT auth | Better Auth (already locked in STACK.md) | Better Auth handles hashing, session rotation, cookie security flags — a hand-rolled version is a security liability for zero benefit |
| Admin role storage/check plumbing | Custom `isAdmin` boolean + ad-hoc middleware | Better Auth `admin` plugin's `role` field + `adminRoles` option | The plugin's role/permission machinery is already built, tested, and is what the phase's own bridge-to-Phase-5 design (students also get `role: "user"` on the same table) depends on |
| Soft-delete bookkeeping | A generic `prisma-soft-delete-middleware`/extension package | A plain `active: Boolean` column with an explicit `WHERE active = true` in the one query that needs it (public catalog) | At this scale (one admin-authored table, one filtered read) a soft-delete framework is overhead; `[CITED: github.com/olivierwilkinson/prisma-soft-delete-middleware exists but is unnecessary machinery for a single boolean flag]` |
| Money formatting/rounding | Custom float-based price math | Integer cents (Pattern 5 above) | Floats silently misround currency; integer cents sidesteps the whole class of bug without pulling in a Decimal library |

**Key insight:** Phase 1 has no genuinely novel hard problem — every piece (auth, admin gating, soft delete, money storage) has an established, boring, correct pattern. The only real design work is the *schema shape* that lets Phases 2 and 5 build on top without a rewrite, which is exactly what Patterns 3, 4, and 6 above lock in.

## Common Pitfalls

### Pitfall 1: Relying on `proxy.ts`/`middleware.ts` as the only admin check
**What goes wrong:** A request-header trick (CVE-2025-29927's `x-middleware-subrequest` class of bug) bypasses the coarse gate, and if nothing else checks the session, an unauthenticated request reaches admin data.
**Why it happens:** Middleware *looks* like the obvious, single place to put "is this user allowed here" — it runs before every matched request, which makes the second/third checks feel redundant.
**How to avoid:** Pattern 2 above — layout-level and Server-Action-level re-checks are mandatory, not defensive paranoia.
**Warning signs:** Any admin Server Action that doesn't independently call `auth.api.getSession(...)`.

### Pitfall 2: Reading `Service.priceCents`/`durationMinutes` live for historical display once Phase 2 exists
**What goes wrong:** A price edit silently rewrites what old appointments "cost," corrupting SERV-02's guarantee — but this bug is invisible in Phase 1 because no appointments exist yet to be corrupted.
**Why it happens:** The natural FK-and-join instinct (`Appointment.service.priceCents`) is what most ORMs make easiest, and nothing in Phase 1 surfaces the mistake.
**How to avoid:** The schema-level comment in Pattern 4 above, carried forward explicitly into Phase 2's own research/plan.
**Warning signs:** Phase 2's `Appointment` model has a `serviceId` FK but no `priceCentsAtBooking`/`durationMinutesAtBooking` columns of its own.

### Pitfall 3: Installing `prisma` unpinned and getting a Prisma 8 RC
**What goes wrong:** `npm install -D prisma` installs `8.0.0-rc.15` today; `@prisma/client@latest` is `7.10.0`. A CLI/client major-version mismatch can break `prisma generate`/`migrate` in ways that are confusing to debug for someone who didn't expect a version skew.
**Why it happens:** `latest` dist-tag semantics assume the two packages release in lockstep, which is usually true but isn't right now, mid-RC-cycle.
**How to avoid:** Pin both to `7.10.0` explicitly in every install command (already reflected in the Installation section above).
**Warning signs:** `prisma -v` reporting an `8.x` CLI version anywhere in the toolchain.

### Pitfall 4: Privacy policy page copy-pasted from a generic template
**What goes wrong:** POL-03 requires the policy to actually describe *this* product's data flows (name+phone for booking, future email+password for students, payment metadata, WhatsApp consent, video-watch progress) — a generic SaaS privacy-policy template won't match, and ANPD guidance explicitly expects language "compatível com o que a empresa realmente faz." `[CITED: farinaeantunes.com.br LGPD guidance via WebSearch]`
**Why it happens:** Writing accurate, product-specific privacy copy in Phase 1 feels premature since payment/WhatsApp/video data collection don't exist until later phases.
**How to avoid:** Write the policy to cover the full product's planned data flows now (it's one public page, cheaper to write comprehensively once than to keep re-announcing changes), but flag it for a non-engineering (legal/consumer-law) review before real launch — STATE.md already carries this exact caveat for the cancellation/refund policy; the privacy policy needs the same caveat.
**Warning signs:** Policy text that could describe literally any SaaS product, with no product-specific nouns (agendamento, sinal, WhatsApp, cursos) in it.

## Runtime State Inventory

> Not applicable — this is a greenfield phase (first phase, empty repo). No rename/refactor/migration is happening.

**Nothing found in any category** — verified by direct listing of the repo root: only `.git/`, `.claude/`, `.planning/`, `README.md`, and two empty directories (`client/`, `server/`) exist. No stored data, no live service config, no OS-registered state, no secrets/env vars, no build artifacts predate this phase.

## Code Examples

### Better Auth handler mount point (App Router convention)
```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/server/modules/identity/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```
`[CITED: better-auth.com — standard App Router mount pattern, confirmed via the admin-plugin doc fetch]`

### Seeding the professional account
```bash
# after `admin` plugin is wired and `npx auth@latest generate && npx prisma migrate dev` has run:
npx auth@latest create-admin --email profissional@example.com --name "Nome da Profissional" --role admin
```
`[CITED: better-auth.com/docs/plugins/admin]` — this is the only account-creation path in Phase 1; there is no public admin-signup route, by design (IDEN-06 says the professional accesses with "credenciais próprias," not that she self-registers). If the CLI path proves unreliable in practice, the documented fallback is a `prisma/seed.ts` script that calls `auth.api.createUser` (or, per the WebSearch findings above, inserts directly via Prisma if running the API path outside an authenticated admin context proves awkward) — either way, this runs exactly once, manually, never as part of a public flow.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `middleware.ts` / exported `middleware()` running on the Edge runtime | `proxy.ts` / exported `proxy()` running on Node.js runtime | Next.js 16 (2026) `[CITED: nextjs.org/docs/messages/middleware-to-proxy]` | Any tutorial/StackOverflow answer referencing `middleware.ts` for Next.js auth predates this and needs the rename applied; Edge-runtime-specific constraints (no Node APIs) no longer apply to this file |
| `@better-auth/cli` | `auth` CLI package | Sometime before 2026-09-18 (exact date not determined this session) `[VERIFIED: npm registry — deprecated field on @better-auth/cli]` | STACK.md's installation snippet references the deprecated package; use `auth` |

**Deprecated/outdated:**
- `shadcn-ui` npm package: superseded by `shadcn` (already flagged in STACK.md, reconfirmed here — still deprecated on the registry).
- Postgres native `money` type for currency storage: discouraged for locale-dependence; use integer cents or `numeric`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `dayOfWeek` should use JS `Date.getDay()` convention (0=Sunday) rather than ISO 8601 (1=Monday) | Pattern 6 — Availability schema | Low-cost to fix now (single enum-like Int column, no data yet), expensive if Phase 2's slot logic is built against the opposite convention without anyone noticing — confirm during discuss/plan review |
| A2 | Fixed `America/Sao_Paulo` (UTC-3, no DST) offset is safe to assume for `WorkingHourRule` without a stored timezone column | Pattern 6 — Timezone Storage Decision | If Brazil ever reinstates DST or the product ever serves a professional outside Brazil, working hours would silently misinterpret — both are unlikely per PROJECT.md's explicit Brazil-only, single-professional scope, but this is a product-scope assumption, not an engineering-verified fact |
| A3 | Privacy policy page should be written to cover the full product's eventual data flows (payments, WhatsApp, video) in Phase 1, not just what Phase 1 itself collects | Pitfall 4 | If the business/legal reviewer disagrees and wants a narrower, phase-scoped policy that's rewritten each phase, the Phase 1 task would need rescoping — flag for the same legal-review gate STATE.md already calls for on the cancellation policy |
| A4 | `adminRoles: ["admin"]` (role-based) is preferable to `adminUserIds: [...]` (id-based) for restricting the Better Auth admin plugin to the single professional | Pattern 3 | Low risk either way — this is a config-option choice within an already-locked library, easily changed before any real users exist |

## Open Questions

1. **Exact `create-next-app` behavior against this specific non-empty repo root**
   - What we know: the CLI has documented friction with non-empty/git-initialized directories, and `--disable-git` is the documented mitigation; a throwaway-folder-then-move fallback is always safe.
   - What's unclear: whether `--disable-git` alone is sufficient given the repo already has `.claude/` and `.planning/` (not just `.git/`) — this wasn't tested against the exact CLI version (16.3.5) in this session.
   - Recommendation: the plan's Wave 0 task should try the in-place command first and fall back to the throwaway-folder-then-move path if the CLI errors or prompts unexpectedly; either outcome is a same-session, low-risk decision, not a research gap that blocks planning.

2. **Better Auth admin-account bootstrap: CLI vs. seed script reliability**
   - What we know: `npx auth@latest create-admin` is the documented path `[CITED: better-auth.com/docs/plugins/admin]`.
   - What's unclear: the WebSearch results also surfaced a GitHub discussion noting `createUser` via the admin API can fail "when running as a script with no user" (i.e., it may expect an already-authenticated admin caller) — it's not fully clear whether the dedicated `create-admin` CLI subcommand avoids that constraint or hits the same one.
   - Recommendation: the plan should try the CLI path first (Wave 0 / first admin-bootstrap task) and have the direct-Prisma-insert-plus-Better-Auth-password-hash fallback documented as a ready Plan B, not discovered mid-execution.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Next.js 16 runtime, all tooling | Not checked this session (Windows dev machine, no `node --version` run against the actual dev environment) | — | Next.js 16 requires Node ≥ 20.9.0 per STACK.md's own compatibility table — confirm locally before Wave 0 |
| PostgreSQL (local or Neon) | Prisma, all schema work | Not provisioned yet (greenfield) | — | STACK.md recommends Neon (serverless Postgres) for a solo dev's iteration loop; local Postgres via Docker is an equally valid Wave 0 fallback if Neon account setup isn't done yet |
| git | Repo already exists | ✓ (`.git/` present) | — | — |

**Missing dependencies with no fallback:** none — everything needed for Phase 1 (Node.js, a Postgres instance) has a documented, standard provisioning path; nothing is genuinely blocking.
**Missing dependencies with fallback:** Postgres instance (Neon vs. local Docker Postgres — either works for Phase 1's scope, no payment/webhook infra needed yet).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 5.x (unit) + Playwright 1.63.x (E2E) — both net-new, no existing test infra (greenfield repo) |
| Config file | none yet — Wave 0 gap |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| IDEN-06 | Professional logs in with own credentials; reaches `/admin` | e2e | `npx playwright test tests/e2e/admin-login.spec.ts` | ❌ Wave 0 |
| IDEN-06 | Unauthenticated visitor to `/admin/*` is redirected, never sees admin content | e2e | `npx playwright test tests/e2e/admin-gate.spec.ts` | ❌ Wave 0 |
| SERV-01 | Create service with name/description/duration/price persists correctly | unit + integration | `npx vitest run tests/unit/catalog.test.ts` | ❌ Wave 0 |
| SERV-02 | Editing a service updates it; deactivating sets `active=false` (not deleted) | unit | `npx vitest run tests/unit/catalog.test.ts` | ❌ Wave 0 |
| SERV-03 | Service carries a fixed `depositCents` value, editable independently of price | unit | `npx vitest run tests/unit/catalog.test.ts` | ❌ Wave 0 |
| SERV-04 | Public catalog page lists only `active=true` services, with duration/price | e2e | `npx playwright test tests/e2e/public-catalog.spec.ts` | ❌ Wave 0 |
| AVAIL-01 | Weekly working-hour rules can be created/edited per day | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ Wave 0 |
| AVAIL-02 | Date/period blocks can be created | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ Wave 0 |
| AVAIL-03 | Buffer-between-appointments setting persists | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ Wave 0 |
| AVAIL-04 | Minimum lead time and booking horizon settings persist | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ Wave 0 |
| POL-03 | Privacy policy page renders publicly with required content sections present | e2e | `npx playwright test tests/e2e/privacy-policy.spec.ts` | ❌ Wave 0 |
| POL-04 | Every Server Action's Zod schema rejects unexpected/extra fields (data minimization) | unit | `npx vitest run tests/unit/zod-schemas.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — no test framework installed yet
- [ ] `playwright.config.ts` + Playwright browsers installed (`npx playwright install`)
- [ ] `prisma/seed.ts` — bootstraps the professional `User` account and, optionally, deterministic test fixtures for a test database
- [ ] A test database (separate Postgres instance/branch from dev) so Vitest/Playwright runs don't mutate real data
- [ ] `tests/unit/`, `tests/e2e/` directories

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | yes | Better Auth `emailAndPassword` provider — never hand-roll hashing/verification |
| V3 Session Management | yes | Better Auth session cookies (httpOnly, secure, sameSite defaults) — do not weaken cookie flags |
| V4 Access Control | yes | Two-layer gate: `proxy.ts` coarse check + layout/Server-Action authoritative role check on every `/admin` mutation (Pattern 2) |
| V5 Input Validation | yes | Zod schema on every Server Action (`createService`, `updateService`, `createWorkingHourRule`, etc.), `.strict()` to reject unexpected fields per POL-04 |
| V6 Cryptography | yes | Password hashing delegated entirely to Better Auth's internal implementation — never a custom hash/compare anywhere in `server/modules/identity/` |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| Middleware/proxy authorization bypass (CVE-2025-29927 class — crafted `x-middleware-subrequest` header) | Elevation of Privilege | Defense-in-depth: authoritative session/role check inside the admin layout and every admin Server Action, never trust `proxy.ts` alone (Pattern 2) |
| Public catalog query accidentally exposing inactive/draft services (e.g., a shared query helper missing the `active=true` filter) | Information Disclosure | The public Server Component's Prisma query must hard-code `WHERE active = true` — never accept a client-supplied filter that could widen it |
| Mass assignment on admin forms (client sends extra fields the Server Action wasn't expecting) | Tampering | Zod `.strict()` schemas at every Server Action boundary — directly implements POL-04's "collect only what's needed" |
| Admin session fixation/theft via a non-httpOnly or non-secure cookie misconfiguration | Spoofing | Rely on Better Auth's cookie defaults; do not override `secure`/`httpOnly`/`sameSite` without a documented reason |

## Sources

### Primary (HIGH confidence)
- npm registry (`registry.npmjs.org`) — direct `npm view` verification this session for `next`, `react`, `react-dom`, `typescript`, `prisma`, `@prisma/client`, `better-auth`, `auth`, `@better-auth/cli`, `zod`, `react-hook-form`, `@hookform/resolvers`, `tailwindcss`, `server-only`, `shadcn`, `date-fns`, `date-fns-tz`, `vitest`, `@playwright/test`, `eslint` — HIGH, `[VERIFIED]`
- `gsd-tools query package-legitimacy check` — HIGH (tool output, this session)
- Direct repo inspection (`ls`, file reads) of the actual working directory — HIGH, `[VERIFIED]`

### Secondary (MEDIUM confidence)
- nextjs.org/docs/messages/middleware-to-proxy, via dev.to/beyondit migration guide (nextjs.org itself was unreachable from this sandbox — DNS resolution failure — corroborated via WebSearch summary of the official page plus multiple independent third-party migration guides describing the same rename/runtime change) — `[CITED]`
- better-auth.com/docs/plugins/admin, /docs/plugins/phone-number, /docs/adapters/prisma — fetched directly via WebFetch this session — `[CITED]`
- cyber.gov.au, offsec.com, zscaler.com — CVE-2025-29927 advisories — `[CITED]`
- crunchydata.com, prisma.io/dataguide, PostgreSQL 18 official docs — money-type guidance — `[CITED]`
- bytebase.com/reference/postgres — timestamptz vs. wall-clock guidance — `[CITED]`
- ANPD-adjacent legal-guidance articles (farinaeantunes.com.br, conjur.com.br) on LGPD for small businesses — `[CITED]`, MEDIUM — not ANPD's own primary text, third-party legal commentary

### Tertiary (LOW confidence)
- dev.to Prisma soft-delete/e-commerce pattern articles — community pattern, not official — informs Pattern 4/5 but is not authoritative
- GitHub discussion threads on Better Auth `createUser`/seeding edge cases — anecdotal, informs Open Question 2

## Metadata

**Confidence breakdown:**
- Standard stack / version corrections: HIGH — every version claim was checked against the live npm registry this session, not carried over from STACK.md's original research date
- Architecture (admin gating, schema patterns): HIGH for the CVE/proxy-rename facts (independently corroborated across multiple sources), MEDIUM for the specific Better Auth admin-plugin option names (single-source WebFetch, not cross-checked against a second independent source)
- Pitfalls: HIGH for the two verified version-drift issues (Prisma RC, deprecated CLI), MEDIUM for the LGPD/privacy-policy content guidance (third-party legal commentary, not ANPD's primary regulatory text)

**Research date:** 2026-09-18
**Valid until:** ~7 days for the two version-pin corrections (prisma dist-tags move fast during an RC cycle — re-verify immediately before Wave 0 if planning is delayed); ~30 days for the architectural patterns (Next.js 16 proxy rename, Better Auth admin plugin shape, schema patterns) which are stable design decisions, not moving targets.
