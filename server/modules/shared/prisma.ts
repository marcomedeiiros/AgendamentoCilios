import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

// Prisma 7 exige um driver adapter: a connection string não flui mais do bloco
// datasource do schema.prisma para o client.
//
// O banco é um arquivo SQLite (DATABASE_URL="file:./prisma/dev.db"), para o
// projeto rodar sem instalar servidor de banco nenhum.
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não está definida. Copie .env.example para .env.");
  }

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// O tsx watch recarrega o módulo a cada alteração, o que abriria uma conexão
// nova por reload. Reaproveita um único client.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
