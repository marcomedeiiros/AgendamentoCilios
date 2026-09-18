# Requirements: AgendamentoCilios

**Defined:** 2026-09-18
**Core Value:** A cliente/aluna resolve tudo sozinha pelo link — agendar um atendimento ou comprar e assistir um curso — sem precisar passar pelo WhatsApp da profissional.

## v1 Requirements

Requisitos para o lançamento inicial. Cada um mapeia para uma fase do roadmap.

### Identidade (IDEN)

- [ ] **IDEN-01**: Cliente agenda informando apenas nome e telefone, sem criar conta nem definir senha
- [ ] **IDEN-02**: Cliente acessa seu próprio agendamento por link com token, sem login
- [ ] **IDEN-03**: Aluna cria conta com e-mail e senha para acessar cursos
- [ ] **IDEN-04**: Aluna faz login e a sessão persiste entre visitas
- [ ] **IDEN-05**: Sistema reconcilia uma pessoa que já era cliente de agendamento e passa a ser aluna, sem duplicar cadastro
- [ ] **IDEN-06**: Profissional acessa o painel administrativo com credenciais próprias

### Catálogo de Serviços (SERV)

- [ ] **SERV-01**: Profissional cadastra um serviço com nome, descrição, duração e preço
- [ ] **SERV-02**: Profissional edita e desativa serviços sem apagar o histórico de agendamentos
- [ ] **SERV-03**: Profissional define o valor fixo do sinal exigido para reservar
- [ ] **SERV-04**: Cliente vê a lista de serviços ativos com duração e preço antes de escolher

### Disponibilidade (AVAIL)

- [ ] **AVAIL-01**: Profissional define seus horários de trabalho por dia da semana
- [ ] **AVAIL-02**: Profissional bloqueia datas e períodos específicos (folgas, compromissos)
- [ ] **AVAIL-03**: Profissional define tempo de intervalo entre atendimentos
- [ ] **AVAIL-04**: Profissional define antecedência mínima para agendar e até quando a agenda fica aberta
- [ ] **AVAIL-05**: Sistema calcula os horários livres a partir das regras e dos agendamentos existentes, respeitando a duração do serviço escolhido
- [ ] **AVAIL-06**: Cliente vê apenas horários realmente disponíveis para o serviço que escolheu

### Agendamento (BOOK)

- [ ] **BOOK-01**: Cliente escolhe serviço, data e horário e cria o agendamento sem aprovação manual
- [ ] **BOOK-02**: Sistema segura o horário enquanto o pagamento do sinal está pendente e libera automaticamente se não for pago no prazo
- [ ] **BOOK-03**: Sistema impede que dois agendamentos ocupem o mesmo horário, mesmo sob requisições simultâneas
- [ ] **BOOK-04**: Agendamento só passa a confirmado após a confirmação do pagamento do sinal
- [ ] **BOOK-05**: Cliente cancela o próprio agendamento pelo link
- [ ] **BOOK-06**: Cliente remarca o próprio agendamento pelo link, escolhendo outro horário livre
- [ ] **BOOK-07**: Profissional vê sua agenda por dia e por semana
- [ ] **BOOK-08**: Profissional cancela ou remarca um agendamento pelo painel
- [ ] **BOOK-09**: Profissional marca um atendimento como concluído ou como falta

### Pagamentos (PAY)

- [ ] **PAY-01**: Cliente paga o sinal via Pix no momento do agendamento
- [ ] **PAY-02**: Aluna paga a compra de um curso via Pix
- [ ] **PAY-03**: Sistema confirma pagamentos exclusivamente por webhook do gateway, nunca pelo retorno do navegador
- [ ] **PAY-04**: Sistema verifica a assinatura de cada webhook recebido e rejeita os inválidos
- [ ] **PAY-05**: Sistema processa cada evento de pagamento uma única vez, mesmo com entregas duplicadas ou fora de ordem
- [ ] **PAY-06**: Sistema aplica a política de reembolso do sinal conforme a antecedência do cancelamento (integral até 24h antes)
- [ ] **PAY-07**: Sistema honra o direito de arrependimento de 7 dias em compras de curso
- [ ] **PAY-08**: Profissional consulta os pagamentos recebidos e seus status

### Notificações (NOTIF)

- [ ] **NOTIF-01**: Cliente recebe confirmação do agendamento por WhatsApp após o sinal ser aprovado
- [ ] **NOTIF-02**: Cliente recebe lembrete por WhatsApp 24 horas antes do atendimento
- [ ] **NOTIF-03**: Cliente recebe lembrete por WhatsApp 2 horas antes do atendimento
- [ ] **NOTIF-04**: Cliente recebe aviso por WhatsApp quando o agendamento é cancelado ou remarcado
- [ ] **NOTIF-05**: Sistema não envia lembrete de agendamento cancelado ou já remarcado
- [ ] **NOTIF-06**: Sistema não envia a mesma mensagem duas vezes para o mesmo agendamento
- [ ] **NOTIF-07**: Cliente consente com o recebimento de mensagens no momento do agendamento

### Cursos (COURSE)

- [ ] **COURSE-01**: Profissional cadastra um curso com título, descrição, preço e imagem
- [ ] **COURSE-02**: Profissional cadastra aulas em um curso, com título, vídeo e ordem
- [ ] **COURSE-03**: Profissional publica e despublica um curso
- [ ] **COURSE-04**: Visitante vê a página de venda de um curso publicado
- [ ] **COURSE-05**: Aluna compra um curso e recebe acesso após a confirmação do pagamento

### Área da Aluna (STUDENT)

- [ ] **STUDENT-01**: Aluna vê a lista dos cursos que comprou
- [ ] **STUDENT-02**: Aluna assiste às aulas de um curso que comprou
- [ ] **STUDENT-03**: Sistema bloqueia o acesso ao vídeo de quem não comprou o curso
- [ ] **STUDENT-04**: Aluna marca aulas como assistidas e vê seu progresso no curso
- [ ] **STUDENT-05**: Aluna retoma de onde parou ao voltar ao curso

### Políticas e Conformidade (POL)

- [ ] **POL-01**: Site apresenta a política de cancelamento e reembolso antes do pagamento do sinal
- [ ] **POL-02**: Site apresenta a política de reembolso do curso, incluindo o prazo de arrependimento
- [ ] **POL-03**: Site publica política de privacidade descrevendo dados coletados, finalidade e retenção
- [ ] **POL-04**: Sistema coleta apenas os dados necessários a cada etapa e não armazena dados de cartão

## v2 Requirements

Adiado para versões futuras. Rastreado, mas fora do roadmap atual.

### Cursos

- **COURSE-06**: Aluna recebe certificado de conclusão do curso
- **COURSE-07**: Liberação gradual de aulas (drip content)
- **COURSE-08**: Marca d'água dinâmica no vídeo com dados da aluna

### Agendamento

- **BOOK-10**: Profissional vê o histórico de atendimentos anteriores de cada cliente
- **BOOK-11**: Lista de espera para horários lotados
- **BOOK-12**: Pacotes e combos de serviços com preço promocional

### Notificações

- **NOTIF-08**: Pedido automático de avaliação após o atendimento
- **NOTIF-09**: Campanhas de marketing por WhatsApp para a base de clientes

### Relatórios

- **ADMIN-01**: Painel com faturamento, taxa de ocupação e taxa de falta

## Out of Scope

Excluído explicitamente. Documentado para evitar expansão de escopo.

| Feature | Reason |
|---------|--------|
| Múltiplas profissionais / agendas de equipe | O negócio é solo; tabela de staff e seletor de profissional são complexidade sem uso. "Dá para adicionar depois" não justifica construir agora |
| Marketplace de vários studios | Fora da visão do produto |
| Cursos presenciais com turmas e vagas | Os cursos são exclusivamente online gravados |
| Entrega de curso via Hotmart/Kiwify | A área da aluna é própria — é parte do produto, não terceirizável |
| Aprovação manual de agendamento | Recria o gargalo do WhatsApp que o produto existe para eliminar |
| Aplicativo mobile nativo | Web-first; mobile só se houver demanda comprovada |
| DRM completo de vídeo | Custo e complexidade de nível Netflix para um modelo de ameaça que não justifica; a proteção nativa do host de vídeo cobre o risco real |
| Retenção cega do sinal em qualquer cancelamento | CDC Art. 51 II anula cláusula que elimina direito a reembolso; a política precisa ser graduada e divulgada |
| Provedor não-oficial de WhatsApp | Risco documentado de banimento permanente do único canal de contato da profissional, sem direito a recurso |
| Gamificação, afiliados, fidelidade | Ruído para um operador solo no v1 |

## Traceability

Quais fases cobrem quais requisitos. Preenchido durante a criação do roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (preenchido pelo roadmapper) | | |

**Coverage:**
- v1 requirements: 51 total
- Mapped to phases: 0 (pendente)
- Unmapped: 51 ⚠️

---
*Requirements defined: 2026-09-18*
*Last updated: 2026-09-18 after initial definition*
