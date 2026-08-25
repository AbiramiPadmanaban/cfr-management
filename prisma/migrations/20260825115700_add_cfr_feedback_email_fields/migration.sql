-- AlterTable
ALTER TABLE "Cfr" ALTER COLUMN "qualityRating" DROP NOT NULL,
ALTER COLUMN "deliveryRating" DROP NOT NULL,
ALTER COLUMN "communicationRating" DROP NOT NULL,
ALTER COLUMN "technicalCompetence" DROP NOT NULL,
ALTER COLUMN "overallSatisfaction" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Cfr" ADD COLUMN "clientEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN "feedbackToken" TEXT,
ADD COLUMN "feedbackSentAt" TIMESTAMP(3),
ADD COLUMN "feedbackSubmittedAt" TIMESTAMP(3);

ALTER TABLE "Cfr" ALTER COLUMN "clientEmail" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Cfr_feedbackToken_key" ON "Cfr"("feedbackToken");
