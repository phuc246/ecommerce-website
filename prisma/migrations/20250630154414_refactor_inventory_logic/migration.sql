/*
  Warnings:

  - The values [CANCELLED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `productId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `detail` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `userEmail` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `userRole` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `productVariantId` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Made the column `entityId` on table `Log` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `productVariantId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductTrend" DROP CONSTRAINT "ProductTrend_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductTrend" DROP CONSTRAINT "ProductTrend_trendId_fkey";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "detail",
DROP COLUMN "userEmail",
DROP COLUMN "userId",
DROP COLUMN "userRole",
ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "level" TEXT NOT NULL,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "entityId" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductTrend" ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTrend" ADD CONSTRAINT "ProductTrend_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTrend" ADD CONSTRAINT "ProductTrend_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
