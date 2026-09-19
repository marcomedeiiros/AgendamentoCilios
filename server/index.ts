import "dotenv/config";

import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./modules/identity/auth";
import { carregarSessao } from "./modules/identity/sessao";
import { rotasDepoimentos } from "./modules/depoimentos/rotas";
import { uploadsPath } from "./modules/depoimentos/armazenamento";
import { rotasCursos } from "./modules/cursos/rotas";
import { rotasPedidos } from "./modules/pedidos/rotas";
import { rotasPagamentos } from "./modules/pagamentos/rotas";
import { rotasAulas } from "./modules/aulas/rotas";
import { rotasAdmin } from "./modules/admin/rotas";
import { rotasConteudo } from "./modules/conteudo/rotas";

const app = express();
const port = process.env.PORT || 3000;
const origemApp = process.env.APP_URL ?? "http://localhost:5173";
const emDesenvolvimento = process.env.NODE_ENV !== "production";

// credentials: o cookie de sessão precisa atravessar as duas portas no dev.
// Em desenvolvimento o navegador pode chegar por localhost, 127.0.0.1 ou IP da
// rede; refletir a origem evita bloqueio bobo. Em produção, só o APP_URL 
// quem de fato valida a origem no login é o Better Auth.
app.use(cors({ origin: emDesenvolvimento ? true : origemApp, credentials: true }));

// O handler do Better Auth lê o corpo por conta própria e precisa vir antes do
// express.json(), senão recebe o stream já consumido.
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "6mb" }));
app.use(carregarSessao);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend rodando perfeitamente!" });
});

app.use("/uploads", express.static(uploadsPath, { maxAge: "7d" }));
app.use("/api/depoimentos", rotasDepoimentos);
app.use("/api/cursos", rotasCursos);
app.use("/api/pedidos", rotasPedidos);
app.use("/api/pagamentos", rotasPagamentos);
app.use("/api/aulas", rotasAulas);
app.use("/api/conteudo", rotasConteudo);
app.use("/api/admin", rotasAdmin);

// Qualquer erro não tratado vira 500 genérico: mensagem de banco ou stack
// trace não pode chegar ao navegador.
app.use((erro: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(erro);
  if (res.headersSent) return;
  res.status(500).json({ erros: ['Erro interno. Tente novamente em instantes.'] });
});

// Em breve: rotas de agendamento (/api/agendamentos) integradas ao Prisma.

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
