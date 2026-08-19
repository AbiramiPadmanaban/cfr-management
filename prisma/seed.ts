import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma";

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

async function main() {
  console.log("Seeding started...");

  // Clean up
  await prisma.cfr.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.department.deleteMany({});

  // 1. Create Departments
  const engineering = await prisma.department.create({
    data: { name: "Engineering", code: "ENG" },
  });
  const finance = await prisma.department.create({
    data: { name: "Finance", code: "FIN" },
  });
  const technology = await prisma.department.create({
    data: { name: "Technology", code: "TEC" },
  });

  console.log("Departments created");

  // 2. Create Projects
  const alpha = await prisma.project.create({
    data: {
      departmentId: engineering.id,
      projectName: "Project Alpha",
      projectNumber: "PRJ-ENG-001",
      clientName: "Client Acme Corp",
    },
  });
  const beta = await prisma.project.create({
    data: {
      departmentId: engineering.id,
      projectName: "Project Beta",
      projectNumber: "PRJ-ENG-002",
      clientName: "Client Stark Industries",
    },
  });
  const gamma = await prisma.project.create({
    data: {
      departmentId: finance.id,
      projectName: "Project Gamma",
      projectNumber: "PRJ-FIN-001",
      clientName: "Client Wayne Enterprises",
    },
  });
  const delta = await prisma.project.create({
    data: {
      departmentId: finance.id,
      projectName: "Project Delta",
      projectNumber: "PRJ-FIN-002",
      clientName: "Client LexCorp",
    },
  });
  const epsilon = await prisma.project.create({
    data: {
      departmentId: technology.id,
      projectName: "Project Epsilon",
      projectNumber: "PRJ-TEC-001",
      clientName: "Client Stark Enterprises",
    },
  });
  const zeta = await prisma.project.create({
    data: {
      departmentId: technology.id,
      projectName: "Project Zeta",
      projectNumber: "PRJ-TEC-002",
      clientName: "Client Cyberdyne",
    },
  });

  console.log("Projects created");

  // 3. Create at least 5 CFR records
  const cfrs = [
    {
      projectId: alpha.id,
      reviewPeriod: "Q1 2026",
      qualityRating: 5,
      deliveryRating: 4,
      communicationRating: 5,
      technicalCompetence: 5,
      overallSatisfaction: 5,
      comments: "Exceptional delivery, quality of work is outstanding.",
      status: "SUBMITTED" as const,
    },
    {
      projectId: beta.id,
      reviewPeriod: "Q1 2026",
      qualityRating: 4,
      deliveryRating: 3,
      communicationRating: 4,
      technicalCompetence: 4,
      overallSatisfaction: 4,
      comments: "Good execution but delivery was slightly delayed.",
      status: "DRAFT" as const,
    },
    {
      projectId: gamma.id,
      reviewPeriod: "Q2 2026",
      qualityRating: 3,
      deliveryRating: 4,
      communicationRating: 3,
      technicalCompetence: 3,
      overallSatisfaction: 3,
      comments: "Average performance, communication can be improved.",
      status: "SUBMITTED" as const,
    },
    {
      projectId: delta.id,
      reviewPeriod: "Q2 2026",
      qualityRating: 5,
      deliveryRating: 5,
      communicationRating: 5,
      technicalCompetence: 5,
      overallSatisfaction: 5,
      comments: "Perfect execution, stellar team communication.",
      status: "SUBMITTED" as const,
    },
    {
      projectId: epsilon.id,
      reviewPeriod: "Q1 2026",
      qualityRating: 2,
      deliveryRating: 2,
      communicationRating: 3,
      technicalCompetence: 2,
      overallSatisfaction: 2,
      comments: "Struggling with technical competence, needs immediate course correction.",
      status: "DRAFT" as const,
    },
  ];

  for (const cfr of cfrs) {
    await prisma.cfr.create({ data: cfr });
  }

  console.log("CFRs seeded successfully.");
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
