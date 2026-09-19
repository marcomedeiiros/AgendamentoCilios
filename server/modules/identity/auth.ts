import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

import { prisma } from "../shared/prisma";

const emDesenvolvimento = process.env.NODE_ENV !== "production";

/**
 * Origens aceitas no login. O Better Auth recusa qualquer outra com
 * "Invalid origin" é a proteção contra CSRF, então a lista existe de
 * propósito.
 *
 * O detalhe que pega: `localhost` e `127.0.0.1` são origens DIFERENTES para o
 * navegador. Abrir o site por um e ter só o outro na lista derruba o login.
 * Em desenvolvimento aceitamos as duas em qualquer porta, e a faixa 192.168.x
 * para testar pelo celular na mesma rede. Em produção nada disso vale: lá só
 * entram APP_URL e o que estiver em TRUSTED_ORIGINS (separado por vírgula).
 */
const origensConfiaveis = [
  ...new Set(
    [
      process.env.APP_URL ?? "http://localhost:5173",
      ...(process.env.TRUSTED_ORIGINS ?? "").split(",").map((o) => o.trim()),
      ...(emDesenvolvimento
        ? ["http://localhost:*", "http://127.0.0.1:*", "http://192.168.*.*:*"]
        : []),
    ].filter(Boolean),
  ),
];

// A profissional é a única conta com role="admin". Quem se cadastra para
// comprar curso recebe o role="user" padrão do plugin não existe caminho de
// código que promova aluna a admin.
//
// adminRoles (por papel) em vez de adminUserIds (por id), porque a forma por id
// quebra se a linha for recriada.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: origensConfiaveis,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  databaseHooks: {
    user: {
      create: {
        // Bootstrap: a primeira conta do sistema vira admin, para o painel ser
        // acessível sem terminal. Vale só enquanto a tabela está vazia  da
        // segunda conta em diante todo mundo entra como "user".
        after: async (usuario) => {
          const total = await prisma.user.count();
          if (total !== 1) return;

          await prisma.user.update({
            where: { id: usuario.id },
            data: { role: "admin" },
          });
          console.log(
            `[auth] ${usuario.email} é a primeira conta do sistema e recebeu acesso de administradora.`,
          );
        },
      },
    },
  },
  plugins: [admin({ adminRoles: ["admin"] })],
});

export type Session = typeof auth.$Infer.Session;
