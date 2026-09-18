---
phase: 1
slug: funda-o-e-painel-da-profissional
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded by plan-phase from `01-RESEARCH.md` § Validation Architecture.
> Task IDs are filled in by the planner; requirement coverage below is authoritative.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 5.x (unit/integration) + Playwright 1.63.x (E2E) — both net-new; greenfield repo has no test infrastructure |
| **Config file** | none — Wave 0 creates `vitest.config.ts` and `playwright.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~60 seconds (unit ~10s, E2E ~50s) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-T2 | 01-01 | 1 | IDEN-06 | T-1-01 | Profissional autenticada alcança `/admin`; sessão válida é exigida | e2e | `npx playwright test tests/e2e/admin-login.spec.ts` | ❌ W0 → 01-01-T3 | ⬜ pending |
| 01-01-T3 | 01-01 | 1 | IDEN-06 | T-1-01, T-1-02 | Visitante não autenticado em `/admin/*` é redirecionado e nunca vê conteúdo admin, inclusive com cabeçalho `x-middleware-subrequest` forjado | e2e | `npx playwright test tests/e2e/admin-gate.spec.ts` | ❌ W0 → 01-01-T3 | ⬜ pending |
| 01-01-T3 | 01-01 | 1 | IDEN-06 | T-1-02 | Ponte `User.clientId` é um-para-um e um segundo `User` não reivindica o mesmo `Client` | unit | `npx vitest run tests/unit/identity.test.ts` | ❌ W0 → 01-01-T3 | ⬜ pending |
| 01-02-T2 | 01-02 | 2 | SERV-01 | T-1-08, T-1-10 | Serviço criado com nome/descrição/duração/preço persiste corretamente | unit | `npx vitest run tests/unit/catalog.test.ts` | ❌ W0 → 01-02-T3 | ⬜ pending |
| 01-02-T3 | 01-02 | 2 | SERV-02 | T-1-11 | Editar atualiza; desativar define `active=false` sem apagar o registro (contagem de linhas inalterada) | unit | `npx vitest run tests/unit/catalog.test.ts` | ❌ W0 → 01-02-T3 | ⬜ pending |
| 01-02-T2 | 01-02 | 2 | SERV-03 | T-1-10 | Serviço carrega `depositCents` fixo, editável independentemente do preço, com `depositCents <= priceCents` | unit | `npx vitest run tests/unit/catalog.test.ts` | ❌ W0 → 01-02-T3 | ⬜ pending |
| 01-02-T2 | 01-02 | 2 | SERV-04 | T-1-09 | Catálogo público lista apenas `active=true`, com duração e preço, sem expor `depositCents` | e2e | `npx playwright test tests/e2e/public-catalog.spec.ts` | ❌ W0 → 01-02-T2 | ⬜ pending |
| 01-04-T2 | 01-04 | 3 | AVAIL-01 | T-1-16, T-1-18 | Regras semanais de horário de trabalho criadas por dia; 09:00 relido como 09:00 (sem deslocamento de fuso) | e2e + unit | `npx playwright test tests/e2e/admin-availability.spec.ts` | ❌ W0 → 01-04-T2 | ⬜ pending |
| 01-04-T3 | 01-04 | 3 | AVAIL-02 | T-1-18 | Bloqueios de data/período são criados e persistem; intervalo invertido é recusado | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ W0 → 01-04-T3 | ⬜ pending |
| 01-04-T3 | 01-04 | 3 | AVAIL-03 | T-1-18 | Intervalo entre atendimentos persiste; valor negativo é recusado | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ W0 → 01-04-T3 | ⬜ pending |
| 01-04-T3 | 01-04 | 3 | AVAIL-04 | T-1-18, T-1-19 | Antecedência mínima e horizonte de agenda persistem; horizonte 0 é recusado | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ W0 → 01-04-T3 | ⬜ pending |
| 01-03-T1 | 01-03 | 2 | POL-03 | T-1-13 | Fonte tipada da política tem todas as seções exigidas, com retenção por categoria e não retenção de dados de cartão | unit | `npx vitest run tests/unit/privacy-policy.test.ts` | ❌ W0 → 01-03-T1 | ⬜ pending |
| 01-03-T2 | 01-03 | 2 | POL-03 | T-1-13 | Página de privacidade renderiza publicamente com as seções exigidas e é alcançável em um clique | e2e | `npx playwright test tests/e2e/privacy-policy.spec.ts` | ❌ W0 → 01-03-T2 | ⬜ pending |
| 01-02-T3 | 01-02 | 2 | POL-04 | T-1-07, T-1-08 | Todo schema Zod das Server Actions do catálogo rejeita campos extras/inesperados (minimização de dados) | unit | `npx vitest run tests/unit/zod-schemas.test.ts` | ❌ W0 → 01-02-T3 | ⬜ pending |
| 01-04-T3 | 01-04 | 3 | POL-04 | T-1-16, T-1-17 | Todo schema Zod das Server Actions de disponibilidade rejeita campos extras/inesperados | unit | `npx vitest run tests/unit/zod-schemas.test.ts` | ❌ W0 → 01-04-T3 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

A infraestrutura de teste inteira nasce no plano **01-01 (onda 1)**; cada arquivo de teste nasce
junto com a fatia que ele verifica, em vez de como stub que passa vazio.

- [ ] `vitest.config.ts` — **01-01-T3**
- [ ] `playwright.config.ts` + browsers instalados (`npx playwright install`) — **01-01-T3**
- [ ] `tests/helpers/db.ts` — banco de teste isolado (`TEST_DATABASE_URL`, distinto de `DATABASE_URL`, com aborto explícito se forem iguais) + `seedTestAdmin()` — **01-01-T3**
- [ ] `tests/unit/identity.test.ts` — ponte `User`/`Client` — **01-01-T3**
- [ ] `tests/e2e/admin-login.spec.ts`, `tests/e2e/admin-gate.spec.ts` — IDEN-06 — **01-01-T3**
- [ ] `tests/e2e/public-catalog.spec.ts` — SERV-04 — **01-02-T2**
- [ ] `tests/unit/catalog.test.ts` — SERV-01, SERV-02, SERV-03 — **01-02-T3**
- [ ] `tests/unit/zod-schemas.test.ts` — POL-04 (criado em **01-02-T3**, estendido em **01-04-T3**)
- [ ] `tests/unit/privacy-policy.test.ts` — POL-03 — **01-03-T1**
- [ ] `tests/e2e/privacy-policy.spec.ts` — POL-03 — **01-03-T2**
- [ ] `tests/e2e/admin-availability.spec.ts` — AVAIL-01 — **01-04-T2**
- [ ] `tests/unit/availability.test.ts` — AVAIL-02, AVAIL-03, AVAIL-04 — **01-04-T3**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Conteúdo jurídico da política de privacidade é adequado e verdadeiro | POL-03 | Teste automatizado confirma que as seções existem e renderizam, mas não consegue julgar se o texto descreve corretamente a coleta real nem se satisfaz a LGPD | Ler a página publicada e conferir cada afirmação contra o que o sistema de fato coleta; revisão jurídica recomendada antes do lançamento |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
