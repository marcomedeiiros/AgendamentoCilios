import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

import { prisma } from "../shared/prisma";

// The single professional is the only account with role="admin". Students who
// sign up in Phase 5 get the plugin's default role="user" — there is no code
// path that promotes a student to admin.
//
// adminRoles (role-based) is used instead of adminUserIds (id-based) because
// the id-based form breaks if the row is ever recreated.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [admin({ adminRoles: ["admin"] })],
});

export type Session = typeof auth.$Infer.Session;
