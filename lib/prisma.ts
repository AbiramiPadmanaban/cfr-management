import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma";

const PRISMA_CLIENT_GEN = 3;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaGen?: number;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || "";
  const dbUrl = new URL(connectionString);
  const pool = new Pool({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || "5432"),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
    ssl: dbUrl.searchParams.get("sslmode") === "disable" ? false : undefined,
  });

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const prisma =
  globalForPrisma.prismaGen === PRISMA_CLIENT_GEN && globalForPrisma.prisma
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaGen = PRISMA_CLIENT_GEN;
}
