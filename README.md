# AgendamentoCilios

Site do Lash&Co Studio: apresentação dos serviços, cursos, pedido de agendamento
e depoimentos enviados pelas clientes.

- `client/` — front-end (React + Vite + Tailwind)
- `server/` — API (Express)

## Rodando

```bash
npm install
npm run dev     # site em http://localhost:5173
npm run server  # API em http://localhost:3000
```

Os dois precisam estar no ar para os depoimentos funcionarem. Em
desenvolvimento o Vite encaminha `/api` e `/uploads` para a porta 3000.

## Depoimentos

Qualquer pessoa pode enviar um depoimento pelo site, com foto opcional. O envio
cai em `server/data/depoimentos.json` com `aprovado: false` e **não aparece no
site enquanto continuar assim**.

Para publicar um depoimento, abra o arquivo e troque o campo para
`"aprovado": true`. Para recusar, apague o item (e a foto correspondente em
`server/data/uploads/`).

Não existe rota HTTP de aprovação de propósito: sem tela de login, ela seria um
buraco aberto para qualquer pessoa publicar o que quisesse.

## Fotos

As imagens do site são de banco de imagens, usadas como placeholder. Troque pelas
fotos reais do studio editando `client/data/site.ts` — arquivos locais vão em
`public/fotos/` e são referenciados como `/fotos/nome.jpg`.
