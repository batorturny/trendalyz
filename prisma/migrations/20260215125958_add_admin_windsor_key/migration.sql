-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "windsorApiKeyEnc" TEXT;

-- CreateIndex
CREATE INDEX "Company_adminId_idx" ON "Company"("adminId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
