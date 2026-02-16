-- CreateEnum
CREATE TYPE "ConnectionProvider" AS ENUM ('TIKTOK_ORGANIC', 'FACEBOOK_ORGANIC', 'INSTAGRAM_ORGANIC');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR', 'PENDING');

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" "ConnectionProvider" NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "externalAccountId" TEXT NOT NULL,
    "externalAccountName" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationConnection_companyId_idx" ON "IntegrationConnection"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_companyId_provider_externalAccountId_key" ON "IntegrationConnection"("companyId", "provider", "externalAccountId");

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
