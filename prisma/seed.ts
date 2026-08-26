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

const DEPARTMENTS = [
  { name: "Digital Transformation", code: "DT" },
  { name: "Sustainability", code: "SUS" },
  { name: "Marketing", code: "MKT" },
  { name: "MUS", code: "MUS" },
  { name: "Vidhai", code: "VID" },
  { name: "Finance", code: "FIN" },
] as const;

async function ensureDepartment(name: string, code: string) {
  const byCode = await prisma.department.findUnique({ where: { code } });
  if (byCode) {
    if (byCode.name !== name) {
      return prisma.department.update({ where: { code }, data: { name } });
    }
    return byCode;
  }

  const byName = await prisma.department.findUnique({ where: { name } });
  if (byName) {
    return prisma.department.update({ where: { id: byName.id }, data: { name, code } });
  }

  return prisma.department.create({ data: { name, code } });
}

async function main() {
  console.log("Seeding department / vertical lookup data...");

  for (const department of DEPARTMENTS) {
    await ensureDepartment(department.name, department.code);
  }

  const allowedCodes = DEPARTMENTS.map((department) => department.code);
  const extras = await prisma.department.findMany({
    where: { code: { notIn: allowedCodes } },
    include: { _count: { select: { projects: true } } },
  });

  for (const extra of extras) {
    if (extra._count.projects === 0) {
      await prisma.department.delete({ where: { id: extra.id } });
      console.log(`Removed unused department: ${extra.name}`);
    } else {
      console.log(
        `Kept ${extra.name} because it still has ${extra._count.projects} project(s).`
      );
    }
  }

  const current = await prisma.department.findMany({ orderBy: { name: "asc" } });
  console.log(
    "Departments ready:",
    current.map((department) => department.name).join(", ")
  );
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
