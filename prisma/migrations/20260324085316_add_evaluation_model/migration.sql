-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "adminMessage" TEXT,
    "adminMessageAt" TIMESTAMP(3),
    "adminUserId" TEXT,
    "clientReaction" TEXT,
    "clientReply" TEXT,
    "clientReplyAt" TIMESTAMP(3),
    "clientReadAt" TIMESTAMP(3),
    "clientUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evaluation_companyId_idx" ON "Evaluation"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_companyId_platform_month_key" ON "Evaluation"("companyId", "platform", "month");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
