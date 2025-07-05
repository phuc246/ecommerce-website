/*
  Warnings:

  - You are about to drop the `_ProductToTrend` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ProductToTrend" DROP CONSTRAINT "_ProductToTrend_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToTrend" DROP CONSTRAINT "_ProductToTrend_B_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "_ProductToTrend";

-- CreateTable
CREATE TABLE "ProductTrend" (
    "productId" TEXT NOT NULL,
    "trendId" TEXT NOT NULL,

    CONSTRAINT "ProductTrend_pkey" PRIMARY KEY ("productId","trendId")
);

-- AddForeignKey
ALTER TABLE "ProductTrend" ADD CONSTRAINT "ProductTrend_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTrend" ADD CONSTRAINT "ProductTrend_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend"("id") ON DELETE CASCADE ON UPDATE CASCADE;
