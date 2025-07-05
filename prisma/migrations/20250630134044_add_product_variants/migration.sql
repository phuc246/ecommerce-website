/*
  Warnings:

  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `salePrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Color` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Size` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Color" DROP CONSTRAINT "Color_productId_fkey";

-- DropForeignKey
ALTER TABLE "Size" DROP CONSTRAINT "Size_productId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price";
ALTER TABLE "Product" DROP COLUMN "salePrice";
ALTER TABLE "Product" DROP COLUMN "stock";

-- DropTable
DROP TABLE "Color";

-- DropTable
DROP TABLE "Size";

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorHex" TEXT,
    "image" TEXT,
    "size" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL,
    "sku" TEXT,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_color_size_key" ON "ProductVariant"("productId", "color", "size");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
