-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "cfrId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_cfrId_fkey" FOREIGN KEY ("cfrId") REFERENCES "Cfr"("id") ON DELETE CASCADE ON UPDATE CASCADE;
