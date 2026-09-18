# Roadmap: AgendamentoCilios

## Overview

O produto tem duas frentes que precisam existir juntas no v1: agendamento self-service com sinal via Pix, e venda de cursos online gravados com área de aluna própria. O roadmap segue a cadeia de dependência descoberta na pesquisa — identidade e configuração da profissional primeiro, depois cálculo de horários e criação de agendamento com trava de concorrência no banco, depois a infraestrutura de pagamento (que é compartilhada entre o sinal e a compra de curso), depois WhatsApp, e por fim a frente de cursos. Cada fase entrega uma capacidade utilizável de ponta a ponta, não uma camada técnica: ao fim da Fase 1 a profissional já montou o catálogo e a agenda dela; ao fim da Fase 2 a cliente já agenda sozinha; ao fim da Fase 3 o sinal trava a vaga de verdade. Como a infraestrutura de pagamento é construída uma única vez na Fase 3, a frente de cursos (Fase 5) depende apenas das Fases 1 e 3 — ela pode rodar em paralelo com a Fase 4 em vez de esperar por ela.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Fundação e Painel da Profissional** - Profissional entra no painel, cadastra serviços com duração/preço/sinal e define sua disponibilidade; catálogo público no ar
- [ ] **Phase 2: Agendamento Self-Service** - Cliente vê horários realmente livres, agenda sozinha só com nome e telefone, e gerencia pelo link; profissional gerencia a agenda
- [ ] **Phase 3: Sinal via Pix e Infraestrutura de Pagamento** - Sinal Pix confirma o agendamento por webhook verificado e idempotente — infraestrutura reutilizada pelos cursos
- [ ] **Phase 4: Confirmação e Lembretes por WhatsApp** - Confirmação, lembretes de 24h e 2h e avisos de cancelamento/remarcação pelo canal onde a cliente já está
- [ ] **Phase 5: Cursos e Área da Aluna** - Profissional publica cursos, aluna compra via Pix, assiste dentro da plataforma e acompanha o próprio progresso

## Phase Details

### Phase 1: Fundação e Painel da Profissional
**Goal**: A profissional consegue, sozinha, montar o negócio dentro do sistema — entra no painel com credenciais próprias, cadastra seus serviços com duração, preço e sinal, e define quando atende — e o catálogo aparece publicamente para a cliente. Tudo isso sobre um modelo de conta único que já acomoda desde o começo tanto a cliente-lite de agendamento (só nome e telefone) quanto a aluna com conta completa, sem duplicar cadastro depois.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: IDEN-06, SERV-01, SERV-02, SERV-03, SERV-04, AVAIL-01, AVAIL-02, AVAIL-03, AVAIL-04, POL-03, POL-04
**Success Criteria** (what must be TRUE):
  1. Profissional entra no painel administrativo com credenciais próprias, e quem não é ela não alcança nenhuma tela do painel.
  2. Profissional cadastra um serviço com nome, descrição, duração e preço, define o valor fixo do sinal, e edita ou desativa um serviço sem que agendamentos antigos daquele serviço se percam ou mudem.
  3. Profissional define seus horários de trabalho por dia da semana, bloqueia datas e períodos específicos, define o intervalo entre atendimentos e define a antecedência mínima e até quando a agenda fica aberta.
  4. Cliente abre o site e vê a lista dos serviços ativos com duração e preço, sem ver os serviços desativados.
  5. Qualquer visitante lê a política de privacidade publicada, que descreve quais dados são coletados, para quê e por quanto tempo — e cada formulário do sistema pede apenas os dados necessários àquela etapa.
**Plans**: 4 plans (3 ondas)

Plans:
- [ ] 01-01-PLAN.md — Walking Skeleton: scaffold Next.js 16 no raiz, esquema de identidade migrado e login real da profissional em `/admin` com portão de duas camadas (onda 1, IDEN-06)
- [ ] 01-02-PLAN.md — Catálogo de serviços do painel à vitrine pública, com centavos inteiros, desativação sem perda de registro e validação estrita (onda 2, SERV-01..04, POL-04)
- [ ] 01-03-PLAN.md — Política de privacidade publicada a partir do que o produto de fato coleta, alcançável de qualquer página pública (onda 2, POL-03)
- [ ] 01-04-PLAN.md — Disponibilidade: janelas semanais, bloqueios de data e período, intervalo, antecedência mínima e horizonte da agenda (onda 3, AVAIL-01..04, POL-04)

**UI hint**: yes

### Phase 2: Agendamento Self-Service
**Goal**: A cliente resolve o agendamento sozinha pelo link, do começo ao fim: escolhe o serviço, vê apenas horários que existem de verdade para a duração daquele serviço, cria o agendamento informando só nome e telefone, e depois cancela ou remarca pelo próprio link — sem conta, sem senha e sem aprovação manual. Do outro lado, a profissional enxerga e opera a agenda no painel. O impedimento de dois agendamentos no mesmo horário é garantido pelo banco (constraint de exclusão sobre o intervalo de tempo), e nasce junto com a criação do agendamento — retrofitar isso depois, com agendamentos reais na base, é caro.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: IDEN-01, IDEN-02, AVAIL-05, AVAIL-06, BOOK-01, BOOK-02, BOOK-03, BOOK-05, BOOK-06, BOOK-07, BOOK-08, BOOK-09
**Success Criteria** (what must be TRUE):
  1. Cliente escolhe um serviço e vê apenas horários realmente livres para aquele serviço — o cálculo respeita a duração do serviço, as janelas de trabalho, os bloqueios, o intervalo entre atendimentos, a antecedência mínima e os agendamentos já existentes.
  2. Cliente escolhe data e horário e cria o agendamento informando apenas nome e telefone, sem criar conta nem definir senha e sem nenhuma aprovação manual da profissional; o horário fica segurado enquanto o sinal está pendente e é liberado automaticamente se o prazo passar.
  3. Duas clientes que confirmam o mesmo horário no mesmo instante: apenas uma consegue o horário; a outra recebe uma mensagem clara de que o horário acabou de ser reservado e escolhe outro — nunca existem dois agendamentos sobrepostos.
  4. Cliente abre o link com token do próprio agendamento, sem login, e cancela ou remarca escolhendo outro horário livre.
  5. Profissional vê sua agenda por dia e por semana, cancela ou remarca um agendamento pelo painel, e marca um atendimento como concluído ou como falta.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Sinal via Pix e Infraestrutura de Pagamento
**Goal**: O sinal passa a ser o que realmente trava a vaga: a cliente paga via Pix no fim do agendamento, e o agendamento só vira "confirmado" quando o webhook do gateway confirma o pagamento — nunca pelo retorno do navegador. Esta fase constrói a camada de pagamento genérica (criação de cobrança, endpoint único de webhook com verificação de assinatura e idempotência, roteamento por referência externa) que a compra de curso da Fase 5 vai reutilizar sem reescrever nada. A política graduada de cancelamento e reembolso é parte desta fase, não um ajuste posterior: ela precisa estar visível antes do pagamento e implementada no código.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: BOOK-04, PAY-01, PAY-03, PAY-04, PAY-05, PAY-06, PAY-08, POL-01
**Success Criteria** (what must be TRUE):
  1. Cliente lê a política de cancelamento e reembolso antes de pagar e paga o sinal via Pix sem sair do fluxo de agendamento.
  2. O agendamento só passa a confirmado depois que o webhook do gateway confirma o pagamento — fechar o navegador não impede a confirmação, e forjar o retorno do navegador não confirma nada.
  3. Webhook com assinatura inválida é rejeitado, e o mesmo evento entregue em duplicidade ou fora de ordem produz exatamente um efeito no sistema.
  4. Cliente que cancela com mais de 24 horas de antecedência recebe o sinal de volta integralmente, conforme a política graduada divulgada antes do pagamento.
  5. Profissional consulta no painel os pagamentos recebidos e o status de cada um, incluindo os que falharam ou estão pendentes de reembolso.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Confirmação e Lembretes por WhatsApp
**Goal**: A cliente passa a ser avisada no canal onde ela já está: confirmação assim que o sinal é aprovado, lembrete 24 horas antes, lembrete 2 horas antes, e aviso quando o agendamento é cancelado ou remarcado. A correção importa mais que o envio em si — lembrete de agendamento cancelado ou já remarcado nunca sai, e a mesma mensagem nunca vai duas vezes para o mesmo agendamento. Nota de execução: a submissão dos templates à Meta tem prazo externo fora do nosso controle e deve começar na abertura da fase, não no fim, para não bloquear a entrega.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-06, NOTIF-07
**Success Criteria** (what must be TRUE):
  1. Cliente recebe no WhatsApp a confirmação do agendamento logo após o sinal ser aprovado.
  2. Cliente recebe lembrete por WhatsApp 24 horas antes e novamente 2 horas antes do atendimento, com data e hora corretas no fuso de São Paulo.
  3. Cliente recebe aviso por WhatsApp quando o agendamento é cancelado ou remarcado, e nenhum lembrete é enviado para agendamento cancelado ou já remarcado.
  4. A mesma mensagem nunca é enviada duas vezes para o mesmo agendamento, mesmo com reprocessamento, retentativa ou duas execuções simultâneas do disparador.
  5. Cliente vê, no momento de informar o telefone, para que ele será usado, e consente com o recebimento de confirmação e lembretes do agendamento.
**Plans**: TBD

### Phase 5: Cursos e Área da Aluna
**Goal**: A segunda frente do produto entra no ar inteira: a profissional cadastra e publica cursos com suas aulas, a aluna descobre o curso pela página de venda, cria conta, compra via Pix reutilizando a infraestrutura de pagamento da Fase 3, e assiste dentro da área de aluna acompanhando o próprio progresso. Quem não comprou não assiste. Uma pessoa que já era cliente de agendamento e vira aluna continua sendo um cadastro só. O direito de arrependimento de 7 dias é honrado com devolução do dinheiro e revogação de acesso no mesmo fluxo. Esta fase depende apenas das Fases 1 e 3 — pode rodar em paralelo com a Fase 4.
**Mode:** mvp
**Depends on**: Phase 3 (independente da Phase 4 — pode executar em paralelo)
**Requirements**: IDEN-03, IDEN-04, IDEN-05, PAY-02, PAY-07, COURSE-01, COURSE-02, COURSE-03, COURSE-04, COURSE-05, STUDENT-01, STUDENT-02, STUDENT-03, STUDENT-04, STUDENT-05, POL-02
**Success Criteria** (what must be TRUE):
  1. Profissional cadastra um curso com título, descrição, preço e imagem, adiciona aulas com título, vídeo e ordem, e publica ou despublica o curso — curso despublicado some da vitrine sem quebrar o acesso de quem já comprou.
  2. Visitante vê a página de venda de um curso publicado com a política de reembolso e o prazo de arrependimento antes de pagar, cria conta com e-mail e senha e paga o curso via Pix.
  3. O acesso ao curso é liberado somente após a confirmação do pagamento pelo mesmo webhook que confirma o sinal, e quem não comprou não consegue assistir ao vídeo nem copiando a URL do player.
  4. Aluna faz login, a sessão persiste entre visitas, ela vê a lista dos cursos que comprou, assiste às aulas, marca aulas como assistidas, vê seu progresso no curso e retoma de onde parou ao voltar.
  5. Uma pessoa que já era cliente de agendamento e passa a comprar um curso continua com um único cadastro, e um pedido de arrependimento dentro de 7 dias devolve o dinheiro e revoga o acesso ao conteúdo na mesma operação.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5
Exception: Phase 5 depende apenas das Fases 1 e 3 e pode executar em paralelo com a Fase 4.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Fundação e Painel da Profissional | 0/4 | Planned | - |
| 2. Agendamento Self-Service | 0/TBD | Not started | - |
| 3. Sinal via Pix e Infraestrutura de Pagamento | 0/TBD | Not started | - |
| 4. Confirmação e Lembretes por WhatsApp | 0/TBD | Not started | - |
| 5. Cursos e Área da Aluna | 0/TBD | Not started | - |

## Coverage

Todos os 54 requisitos v1 mapeados para exatamente uma fase. Sem órfãos, sem duplicatas.

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1 | IDEN-06, SERV-01..04, AVAIL-01..04, POL-03, POL-04 | 11 |
| 2 | IDEN-01, IDEN-02, AVAIL-05, AVAIL-06, BOOK-01, BOOK-02, BOOK-03, BOOK-05..09 | 12 |
| 3 | BOOK-04, PAY-01, PAY-03, PAY-04, PAY-05, PAY-06, PAY-08, POL-01 | 8 |
| 4 | NOTIF-01..07 | 7 |
| 5 | IDEN-03, IDEN-04, IDEN-05, PAY-02, PAY-07, COURSE-01..05, STUDENT-01..05, POL-02 | 16 |
| **Total** | | **54** |

---
*Roadmap created: 2026-09-18*
