# AgendamentoCilios

Site da Alicia Lash Designer: apresentação dos serviços, pedido de agendamento,
depoimentos enviados pelas clientes e venda de cursos online.

- `client/`  front-end (React + Vite + Tailwind)
- `server/` API (Express + Prisma)

## Rodando

```bash
npm install
cp .env.example .env   # preencha antes de seguir
npm run db:migrate     # cria as tabelas
npm run db:seed        # cursos de exemplo (opcional)
npm run dev            # site em http://localhost:5173
npm run server         # API em http://localhost:3000
```

Os dois processos precisam estar no ar. Em desenvolvimento o Vite encaminha
`/api` e `/uploads` para a porta 3000.

Sem banco configurado o site continua abrindo: a seção de cursos online e os
depoimentos enviados simplesmente não aparecem.

## Painel de administração

Em `/admin`, só para contas com `role: "admin"`. Crie a sua com:

```bash
npm run admin:criar -- alicia@exemplo.com "SuaSenhaForte" "Alicia"
```

A senha vai para o Better Auth, que faz o hash — ela não fica em texto puro em
lugar nenhum. Se a conta já existir, o comando só promove a admin.

O painel tem cinco abas:

- **Conteúdo do site** — contato, endereço, horário, Instagram, as fotos do topo,
  da seção "O studio" e do agendamento, e os quatro números da home.
- **Serviços** — criar, editar e tirar do site, cada um com sua foto.
- **Cursos** — criar e editar curso, subir capa, adicionar e apagar aulas, subir
  o vídeo de cada uma e marcar aula como amostra grátis.
- **Depoimentos** — publicar, tirar do site e excluir.
- **Vendas** — as últimas 100 compras com a situação do pagamento.

Duas exclusões são propositalmente parciais: serviço sai do site mas continua no
banco (é referência de agendamento antigo), e curso com aluna matriculada é
despublicado em vez de apagado — apagar tiraria o acesso de quem pagou.

Enquanto nada for editado no painel, o site usa o conteúdo que está no código.

## Cursos online

Fluxo da compra:

1. a aluna cria conta (e-mail e senha, via Better Auth);
2. clica em comprar e é levada ao checkout do Mercado Pago;
3. paga com PIX, cartão ou boleto **no site do Mercado Pago** nenhum dado de
   cartão passa pela nossa aplicação;
4. o Mercado Pago chama nosso webhook, que confere a assinatura e o valor e só
   então cria a matrícula;
5. o curso aparece em **Minha conta**.

A tela de retorno do pagamento **não** libera acesso: ela só consulta o pedido.
Quem libera é o webhook, porque a URL de retorno é controlada pelo navegador da
cliente e não prova pagamento nenhum.

### Configurando o Mercado Pago

1. Crie a aplicação no [painel de desenvolvedores](https://www.mercadopago.com.br/developers/panel).
2. Copie o **access token de teste** para `MERCADOPAGO_ACCESS_TOKEN` no `.env`.
3. Cadastre o webhook apontando para `https://SEU_DOMINIO/api/pagamentos/mercadopago/webhook`
   e copie a assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`.
4. Para testar na sua máquina, exponha a porta 3000 com um túnel (ngrok,
   cloudflared) e use essa URL pública no passo 3 o Mercado Pago precisa
   alcançar o webhook de fora.

Sem `MERCADOPAGO_WEBHOOK_SECRET` o webhook recusa tudo com 401, de propósito:
sem validar assinatura, qualquer pessoa que descubra a URL liberaria curso de
graça.

### Vídeos das aulas

Os arquivos ficam em `server/data/videos/`, fora de qualquer pasta pública. O
vídeo sai por `/api/aulas/:id/video`, que confere matrícula a cada requisição e
responde a `Range` para o player poder avançar.

Envio (só admin), com o arquivo cru no corpo da requisição:

```bash
curl -X PUT --data-binary @aula1.mp4 -H "Content-Type: video/mp4" -b cookies.txt \
  http://localhost:3000/api/aulas/<ID_DA_AULA>/video
```

Ainda não existe tela de administração: cursos e aulas são criados pelo seed ou
pelo `npm run db:studio`.

### Tornando alguém admin

O cadastro sempre cria `role: "user"`. Para promover, edite a linha da pessoa na
tabela `user` (por exemplo pelo `npm run db:studio`) e troque `role` para
`"admin"`.

## Depoimentos

Qualquer pessoa pode enviar um depoimento pelo site, com foto opcional. O envio
cai em `server/data/depoimentos.json` com `aprovado: false` e **não aparece no
site enquanto continuar assim**.

Pelo painel em `/admin`, aba Depoimentos, dá para publicar, tirar do site e
excluir. Sem painel, troque `"aprovado": true` no arquivo. Para recusar, apague o
item (e a foto em `server/data/uploads/`).

Não existe rota HTTP de aprovação de propósito: sem tela de login, ela seria um
buraco aberto para qualquer pessoa publicar o que quisesse.

## Fotos

As imagens do site são de banco de imagens, usadas como placeholder. Troque pelas
fotos reais do studio editando `client/data/site.ts` arquivos locais vão em
`public/fotos/` e são referenciados como `/fotos/nome.jpg`.
