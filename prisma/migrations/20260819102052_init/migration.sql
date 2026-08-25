-- CreateEnum
CREATE TYPE "CfrStatus" AS ENUM ('DRAFT', 'SENT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectStartDate" TIMESTAMP(3) NOT NULL,
    "projectEndDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cfr" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "reviewPeriod" TEXT NOT NULL,
    "qualityRating" INTEGER NOT NULL,
    "deliveryRating" INTEGER NOT NULL,
    "communicationRating" INTEGER NOT NULL,
    "technicalCompetence" INTEGER NOT NULL,
    "overallSatisfaction" INTEGER NOT NULL,
    "comments" TEXT,
    "status" "CfrStatus" NOT NULL DEFAULT 'DRAFT',
    "client" TEXT NOT NULL,
    "projectNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cfr_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Project_departmentId_projectName_key" ON "Project"("departmentId", "projectName");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cfr" ADD CONSTRAINT "Cfr_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
