-- CreateTable
CREATE TABLE "ReportCache" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'TIKTOK_ORGANIC',
    "month" TEXT NOT NULL,
    "jsonData" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportCache_cachedAt_idx" ON "ReportCache"("cachedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCache_companyId_provider_month_key" ON "ReportCache"("companyId", "provider", "month");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "ReportCache" ADD CONSTRAINT "ReportCache_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
