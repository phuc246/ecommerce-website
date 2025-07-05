/*
  Warnings:

  - You are about to drop the column `addressId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingAddress` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_addressId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_orderId_fkey";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "addressId",
DROP COLUMN "paymentId",
ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "shippingAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
