import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

import { prisma } from "../shared/prisma";

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
  // O front roda em outra porta no desenvolvimento; sem isso o cookie de
  // sessão é recusado.
  trustedOrigins: [process.env.APP_URL ?? "http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  databaseHooks: {
    user: {
      create: {
        // Bootstrap: a primeira conta do sistema vira admin, para o painel ser
        // acessível sem terminal. Vale só enquanto a tabela está vazia — da
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
