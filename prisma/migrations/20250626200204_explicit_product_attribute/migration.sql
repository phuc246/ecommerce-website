/*
  Warnings:

  - You are about to drop the `_AttributeToProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_AttributeToProduct" DROP CONSTRAINT "_AttributeToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_AttributeToProduct" DROP CONSTRAINT "_AttributeToProduct_B_fkey";

-- DropTable
DROP TABLE "_AttributeToProduct";

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "productId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("productId","attributeId")
);

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
