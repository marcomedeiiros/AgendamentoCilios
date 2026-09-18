import "dotenv/config";

import { defineConfig, env } from "prisma/config";

// Prisma 7: the connection URL lives here (for the CLI and migrations) rather
// than in schema.prisma's datasource block, which no longer accepts `url`.
// The runtime client gets its connection through a driver adapter instead —
// see server/modules/shared/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
