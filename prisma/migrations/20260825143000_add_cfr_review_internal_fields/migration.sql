-- AlterTable
ALTER TABLE "Cfr" ADD COLUMN "reviewedBy" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "actionNeeded" BOOLEAN;
