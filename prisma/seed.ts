import "dotenv/config";
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
const prisma = new PrismaClient({ adapter });

async function ensureDepartment(name: string, code: string) {
  return prisma.department.upsert({
    where: { code },
    update: { name },
    create: { name, code },
  });
}

async function main() {
  console.log("Seeding lookup data only (no CFR records)...");

  await ensureDepartment("Engineering", "ENG");
  await ensureDepartment("Finance", "FIN");
  await ensureDepartment("Technology", "TEC");

  console.log("Departments are ready. CFR records are not seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
