import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma";

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

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
