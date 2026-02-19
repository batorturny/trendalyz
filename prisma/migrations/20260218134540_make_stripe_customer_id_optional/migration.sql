/*
  Warnings:

  - You are about to drop the column `windsorWorkspaceId` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the `Integration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Integration" DROP CONSTRAINT "Integration_companyId_fkey";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "windsorWorkspaceId";

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "stripeCustomerId" DROP NOT NULL;

-- DropTable
DROP TABLE "Integration";

-- DropEnum
DROP TYPE "IntegrationProvider";

-- DropEnum
DROP TYPE "IntegrationStatus";
