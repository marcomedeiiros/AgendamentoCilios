# Walking Skeleton — AgendamentoCilios

**Phase:** 1
**Generated:** 2026-09-18
**Status:** proposto (as decisões marcadas como *porta de mão única* são confirmadas nos `checkpoint:decision` durante a execução; atualize este arquivo se a escolha divergir)

## Capability Proven End-to-End

A profissional faz login em `/admin/login` com credenciais próprias, gravadas num Postgres real, e chega ao painel com o próprio nome na tela — e nenhuma requisição sem sessão renderiza conteúdo administrativo.

Essa é a fatia mais fina que atravessa a pilha inteira: rota pública, rota protegida, autenticação real, escrita no banco (`Session`), leitura do banco (`User`), interação de UI real (formulário de login) e comando documentado de execução local de pilha completa. Tudo o que a Fase 1 constrói depois — catálogo, disponibilidade, política — é expansão horizontal a partir dessa espinha.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16.3.5, App Router, sem `--src-dir` | Decisão travada em PROJECT.md: monolito único, não `client/` + `server/` separados. Server Actions dispensam uma API REST paralela e um operador solo mantém um deploy só. `app/` fica no raiz, simétrico ao `server/` já existente |
| Runtime | Node.js >= 20.9.0, React 19.3.0, TypeScript 7.0.2 | Mínimo exigido pelo Next.js 16; React 19 é o par recomendado para Server Components |
| Data layer | PostgreSQL + Prisma **7.10.0** (CLI e client travados com `--save-exact`) | `prisma@latest` resolve hoje para `8.0.0-rc.15`, um release candidate, enquanto `@prisma/client@latest` ainda é `7.10.0`. Instalar sem travar produz CLI 8 contra client 7 e quebra `prisma generate` |
| Auth | Better Auth 1.7.5 com `prismaAdapter`, `emailAndPassword` e plugin `admin({ adminRoles: ["admin"] })` | Estável (ao contrário de Auth.js v5, ainda em beta), mantém a lógica de autenticação no repositório e no mesmo esquema Prisma que já pertence ao projeto. O plugin `admin` traz a coluna `role`, que separa a profissional (`admin`) da aluna da Fase 5 (`user`) na mesma tabela |
| Auth CLI | pacote `auth` (`npx auth@latest generate` / `create-admin`) | `@better-auth/cli` está marcado como deprecated no registro npm. O `.claude/CLAUDE.md` ainda cita o pacote antigo; o 01-RESEARCH.md o supersede |
| Portão administrativo | **Duas camadas**: `proxy.ts` (rejeito rápido) + `requireAdminSession()` no `app/(admin)/layout.tsx` e em **toda** Server Action | Next.js 16 renomeou `middleware.ts` para `proxy.ts` (função exportada `proxy`, runtime Node em vez de Edge). Existe classe documentada de bypass por cabeçalho forjado contra gates implementados só nessa camada (CVE-2025-29927); por isso o proxy nunca é a autoridade |
| Identidade dual *(porta de mão única — 01-01 Task 1)* | `User` do Better Auth + tabela `Client` separada, ligadas por `User.clientId` anulável e único | A cliente de agendamento da Fase 2 (só nome e telefone, sem senha e sem sessão) vira linha em `Client`; a aluna da Fase 5 e a profissional viram `User`. A reconciliação do IDEN-05 é um UPDATE colocando `clientId`, sem deduplicação e sem perda de histórico. Mantém `User` na forma que o adaptador do Better Auth exige |
| Dinheiro *(porta de mão única — 01-02 Task 1)* | `Int` em centavos (`priceCents`, `depositCents`) | Moeda única (BRL), sem requisito de fração de centavo. O tipo `money` do Postgres é dependente de locale e desaconselhado; `Decimal` arrastaria um valor embrulhado pelo código inteiro sem ganho. Formatação para `R$` só no momento de exibir |
| Ciclo de vida do serviço *(porta de mão única — 01-02 Task 1)* | `active Boolean @default(true)`, nunca remoção física; contrato de snapshot documentado no esquema para o `Appointment` da Fase 2 | Success criterion 2 do ROADMAP exige que editar ou desativar um serviço não altere agendamentos antigos. O `Appointment` da Fase 2 copia `serviceName`, `durationMinutes`, `priceCents` e `depositCents` para colunas próprias na criação |
| Tempo *(porta de mão única — 01-04 Task 1)* | Regra semanal em hora de parede (`@db.Time`), bloqueio em instante com fuso (`@db.Timestamptz`), `America/Sao_Paulo` fixo | Uma regra recorrente não tem instante; forçá-la em `timestamptz` cria um deslocamento silencioso de fuso. Brasil sem horário de verão desde 2019 e produto exclusivamente brasileiro, por isso não há coluna de fuso por regra |
| Validação | Zod 4.6.5 via `parseStrict()` em `server/modules/shared/validation.ts`, aplicado no limite de **toda** Server Action | `.strict()` recusa campo não declarado: fecha mass assignment e implementa o POL-04 ("coleta apenas os dados necessários a cada etapa") num ponto único em vez de por formulário |
| Deployment target | Vercel Pro para produção (plano Hobby proíbe uso comercial e limita Cron a 1×/dia, o que quebraria os lembretes da Fase 4). **Nesta fase**: execução local de pilha completa, documentada abaixo | O deploy em produção não é pré-requisito do esqueleto; o que o esqueleto precisa provar é que a pilha inteira roda de um clone limpo |
| Directory layout | `app/` (rotas, grupos `(public)` e `(admin)`), `components/` (UI compartilhada), `server/modules/{identity,catalog,availability,shared}/` (domínio, com `server-only`), `prisma/`, `tests/{unit,e2e}/`, `proxy.ts` no raiz | Corresponde ao `server/` já existente no repositório, repropositado como árvore de módulos de domínio. O `client/` vazio é removido: o papel dele é coberto por `app/` + `components/` |
| Test harness | Vitest 5.x (unitário/integração contra `TEST_DATABASE_URL`) + Playwright 1.63.x (e2e) | Banco de teste isolado obrigatório; `resetTestDatabase()` aborta se `TEST_DATABASE_URL` for igual a `DATABASE_URL` |

## Stack Touched in Phase 1

- [x] Project scaffold — `create-next-app` no raiz (`--disable-git`), com caminho alternativo de pasta temporária se a CLI recusar o diretório não-vazio; lint e build configurados; Vitest e Playwright instalados — *plano 01-01, tasks 2 e 3*
- [x] Routing — rotas reais em ambos os grupos: `/`, `/servicos`, `/politica-de-privacidade` (público) e `/admin/login`, `/admin`, `/admin/servicos`, `/admin/disponibilidade` (protegido) — *planos 01-01 a 01-04*
- [x] Database — escrita real (`prisma/seed.ts` cria a conta da profissional; `Session` é gravada no login; `Service` e as regras de agenda são gravadas pelo painel) e leitura real (`/servicos` consulta `Service WHERE active = true`) — *planos 01-01, 01-02, 01-04*
- [x] UI — interação real: o formulário de login em `/admin/login` submete para uma Server Action que autentica e redireciona — *plano 01-01, task 2*
- [x] Deployment — comando local de pilha completa documentado: `npm ci && npx prisma migrate deploy && npx tsx prisma/seed.ts && npm run dev`, com `npm run build` e `npm test` verdes a partir de um clone limpo — *plano 01-01, tasks 2 e 3*

## Out of Scope (Deferred to Later Slices)

Explicitamente **fora** do esqueleto. Esta lista existe para que as fases seguintes não reabram o minimalismo da Fase 1:

- Cálculo de horários livres a partir das regras — Fase 2. A Fase 1 apenas **grava** as regras na forma certa; não computa slot nenhum.
- Modelo `Appointment` e a constraint `EXCLUDE USING gist` contra duplo agendamento — Fase 2 (nasce junto com a criação de agendamento; retrofit com dados reais é caro).
- Qualquer integração de pagamento, Pix, webhook ou `webhook_events` — Fase 3.
- Política de cancelamento e reembolso graduada — Fase 3 (a Fase 1 publica apenas a política de **privacidade**).
- Qualquer envio de WhatsApp, template da Meta ou registro de consentimento de mensagem — Fase 4.
- Cursos, aulas, matrícula, player de vídeo e progresso — Fase 5.
- Cadastro público de aluna e login de aluna — Fase 5. A Fase 1 cria a conta da profissional **apenas por seed**; não existe rota pública de cadastro de administrador, por desenho.
- Recuperação de senha, verificação de e-mail e autenticação em dois fatores — não exigidos por nenhum requisito v1.
- Suporte a múltiplas profissionais, seletor de profissional, convite de equipe ou papéis além de `admin` e `user` — fora de escopo em PROJECT.md e em REQUIREMENTS.md.
- Deploy em produção na Vercel e configuração de domínio — o alvo está decidido, a execução não pertence a esta fase.
- Paginação, busca e ordenação no catálogo público — unidades de serviços, não milhares.
- Ferramenta de exclusão/anonimização de dados sob demanda — a política publicada declara o caminho; a automação é trabalho posterior, conforme PITFALLS.md.

## Subsequent Slice Plan

Cada fase seguinte acrescenta uma fatia vertical sobre este esqueleto sem alterar suas decisões arquiteturais:

- **Fase 2 — Agendamento Self-Service:** a cliente escolhe serviço, vê horários realmente livres (função pura sobre `WorkingHourRule` + `AvailabilityBlock` + `SchedulingSettings` + agendamentos), agenda com nome e telefone (linha em `Client`, sem sessão), e gerencia pelo link com token. Consome os três contratos de leitura do plano 01-04 e a tabela `Client` do plano 01-01.
- **Fase 3 — Sinal via Pix:** camada de pagamento genérica (cobrança, webhook único com verificação de assinatura e idempotência, roteamento por referência externa). Consome `Service.depositCents` do plano 01-02.
- **Fase 4 — WhatsApp:** confirmação e lembretes pelo canal oficial da Meta, com dedupe por mensagem. Consome o telefone gravado em `Client`.
- **Fase 5 — Cursos e Área da Aluna:** a aluna cria conta (`User` com `role: "user"` na mesma tabela da profissional), compra via a infraestrutura da Fase 3 e assiste dentro da plataforma. Consome a ponte `User.clientId` do plano 01-01 para que uma cliente que vira aluna continue sendo um cadastro só (IDEN-05).
