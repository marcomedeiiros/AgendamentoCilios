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
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  // O front roda em outra porta no desenvolvimento; sem isso o cookie de
  // sessão é recusado.
  trustedOrigins: [process.env.APP_URL ?? "http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [admin({ adminRoles: ["admin"] })],
});

export type Session = typeof auth.$Infer.Session;
