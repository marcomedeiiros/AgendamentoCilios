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
| TBD | TBD | TBD | IDEN-06 | T-1-01 | Profissional autenticada alcança `/admin`; sessão válida é exigida | e2e | `npx playwright test tests/e2e/admin-login.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | IDEN-06 | T-1-02 | Visitante não autenticado em `/admin/*` é redirecionado e nunca vê conteúdo admin | e2e | `npx playwright test tests/e2e/admin-gate.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SERV-01 | — | Serviço criado com nome/descrição/duração/preço persiste corretamente | unit | `npx vitest run tests/unit/catalog.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SERV-02 | — | Editar atualiza; desativar define `active=false` sem apagar o registro | unit | `npx vitest run tests/unit/catalog.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SERV-03 | — | Serviço carrega `depositCents` fixo, editável independentemente do preço | unit | `npx vitest run tests/unit/catalog.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SERV-04 | — | Catálogo público lista apenas `active=true`, com duração e preço | e2e | `npx playwright test tests/e2e/public-catalog.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AVAIL-01 | — | Regras semanais de horário de trabalho criadas/editadas por dia | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AVAIL-02 | — | Bloqueios de data/período são criados e persistem | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AVAIL-03 | — | Intervalo entre atendimentos persiste | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AVAIL-04 | — | Antecedência mínima e horizonte de agenda persistem | unit | `npx vitest run tests/unit/availability.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | POL-03 | — | Página de privacidade renderiza publicamente com as seções exigidas | e2e | `npx playwright test tests/e2e/privacy-policy.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | POL-04 | T-1-03 | Todo schema Zod de Server Action rejeita campos extras/inesperados (minimização de dados) | unit | `npx vitest run tests/unit/zod-schemas.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — nenhum framework de teste instalado ainda
- [ ] `playwright.config.ts` + browsers instalados (`npx playwright install`)
- [ ] `tests/unit/catalog.test.ts` — stubs para SERV-01, SERV-02, SERV-03
- [ ] `tests/unit/availability.test.ts` — stubs para AVAIL-01..04
- [ ] `tests/unit/zod-schemas.test.ts` — stubs para POL-04
- [ ] `tests/e2e/admin-login.spec.ts`, `tests/e2e/admin-gate.spec.ts` — stubs para IDEN-06
- [ ] `tests/e2e/public-catalog.spec.ts` — stub para SERV-04
- [ ] `tests/e2e/privacy-policy.spec.ts` — stub para POL-03
- [ ] Banco de teste isolado + fixtures compartilhadas (seed da profissional admin)

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
