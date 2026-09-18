# AgendamentoCilios

## What This Is

Plataforma web própria de uma lash designer autônoma, com duas frentes no mesmo produto: agendamento self-service de aplicações de cílios (a cliente escolhe serviço e horário sozinha e paga um sinal para travar a vaga) e venda de cursos online gravados de extensão de cílios (a aluna compra e assiste dentro de uma área de aluna com acompanhamento de progresso). Substitui o fluxo atual de WhatsApp + caderno.

## Core Value

A cliente/aluna resolve tudo sozinha pelo link — agendar um atendimento ou comprar e assistir um curso — sem precisar passar pelo WhatsApp da profissional.

## Business Context

- **Customer**: Clientes de aplicação de cílios (agendamento) e aspirantes a lash designer (cursos) — uma profissional solo atende ambas
- **Revenue model**: Sinal antecipado + saldo do serviço presencial, e venda avulsa de cursos online gravados
- **Success metric**: Zero agendamentos fechados via WhatsApp — todos entram pelo link
- **Strategy notes**: Ambas as frentes são obrigatórias no v1; nenhuma é "extra"

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Cliente visualiza catálogo de serviços com duração e preço próprios de cada um
- [ ] Cliente escolhe serviço, vê horários realmente livres e agenda sozinha, sem aprovação manual
- [ ] Cliente paga sinal online para confirmar/travar o horário
- [ ] Profissional define sua disponibilidade (dias, janelas de atendimento, bloqueios/folgas)
- [ ] Profissional vê e gerencia a agenda (consultar, remarcar, cancelar)
- [ ] Cliente recebe confirmação e lembrete automáticos por WhatsApp
- [ ] Aluna compra curso online gravado e paga pela plataforma
- [ ] Aluna acessa área de aluna com login próprio e assiste às aulas
- [ ] Aluna acompanha o próprio progresso (o que já assistiu)
- [ ] Profissional cadastra e publica cursos e suas aulas

### Out of Scope

- Múltiplas profissionais / agendas de equipe — o negócio é solo hoje; multi-profissional vira complexidade de escala sem valor imediato
- Marketplace de vários studios — fora da visão do produto
- Cursos presenciais com turmas e vagas — os cursos são exclusivamente online gravados
- Plataforma externa de cursos (Hotmart/Kiwify) — a área de aluna é própria, é parte do produto
- Aprovação manual de agendamento pela profissional — o self-service sem intermediação É o core value; aprovar manualmente recria o gargalo do WhatsApp
- Aplicativo mobile nativo — web-first; mobile depois se houver demanda

## Context

- **Situação atual**: tudo é fechado por conversa no WhatsApp e anotado à mão em caderno. Isso gera esquecimento, retrabalho e no-shows.
- **Base de código**: projeto greenfield. O repositório tem apenas as pastas vazias `client/` e `server/`, sugerindo uma separação frontend/backend ainda a ser definida.
- **Duas audiências distintas no mesmo sistema**: a cliente de aplicação (fluxo transacional curto, pode nem ter conta) e a aluna de curso (precisa de conta persistente com acesso de longo prazo). O modelo de identidade precisa acomodar ambas sem obrigar a cliente de cílios a criar conta completa só para agendar.
- **WhatsApp é onde as clientes já estão** — por isso os lembretes vão para lá e não para e-mail. Isso é uma decisão de produto, não de conveniência técnica.
- **Mercado brasileiro**: Pix é meio de pagamento esperado tanto para o sinal quanto para os cursos.

## Constraints

- **Integração**: Lembretes e confirmações por WhatsApp — a cliente não lê e-mail; é o canal onde ela já está. Exige API oficial (Meta Cloud API, com custo por conversa e aprovação de templates) ou provedor não-oficial (ex: Z-API, Evolution API — mais barato, com risco de bloqueio da conta). Decisão pendente de pesquisa.
- **Pagamento**: Precisa receber Pix para sinal e para cursos — padrão de mercado no Brasil. Gateway ainda não escolhido.
- **Escopo**: Ambas as frentes (agendamento e cursos) precisam funcionar no v1 — não dá para lançar só metade.
- **Operação**: Uma única profissional operando — o sistema não pode exigir trabalho manual de intermediação para funcionar.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Agendamento self-service, sem aprovação manual | Aprovar manualmente recria o gargalo do WhatsApp que o produto existe para eliminar | — Pending |
| Sinal antecipado para reservar horário | Compromete a cliente financeiramente e reduz no-show — problema real do fluxo atual | — Pending |
| Cursos online gravados (não presenciais) | Escala sem consumir a agenda de atendimento da profissional | — Pending |
| Área de aluna própria, não Hotmart/Kiwify | Mantém a aluna dentro do produto e permite acompanhamento de progresso | — Pending |
| Lembretes por WhatsApp (não e-mail) | É o canal onde a cliente já está e efetivamente lê | — Pending |
| Catálogo de serviços com durações distintas | Volume russo, clássico, híbrido e manutenção ocupam tempos diferentes na agenda | — Pending |
| Gateway: Mercado Pago | Pix a 0,99% sem piso vs. R$1,99 fixos do Asaas; ponto de equilíbrio ~R$201 e o negócio é sinal de ticket baixo e alta frequência | — Pending |
| WhatsApp: API oficial da Meta (Cloud API) | Provedores não-oficiais são mais baratos, mas o disparo em lote dos lembretes é o gatilho documentado de banimento — e esse é o único canal com as clientes | — Pending |
| Vídeo dos cursos: Panda Video | Brasileiro, cobrança em BRL, já traz DRM, marca d'água dinâmica e domain lock no plano | — Pending |
| Monolito único em Next.js, não client/server separados | Server Actions dispensam API REST separada; um deploy só para operador solo. `client/` e `server/` viram diretórios internos do mesmo app, não dois serviços | — Pending |
| Reembolso graduado em vez de retenção cega do sinal | CDC Art. 49 dá arrependimento de 7 dias em compra à distância e Art. 51 II anula cláusula que elimina reembolso; o sinal segue como dissuasor, mas a política precisa ser graduada e divulgada antes do pagamento | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-18 after initialization*
