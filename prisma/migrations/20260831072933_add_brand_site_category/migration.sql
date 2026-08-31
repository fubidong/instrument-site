-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "siteCategoryId" TEXT;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_siteCategoryId_fkey" FOREIGN KEY ("siteCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
