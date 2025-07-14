import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Lấy top 5 sản phẩm bán chạy nhất (tổng số lượng đã bán, chỉ tính đơn DELIVERED)
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { not: 'CANCELLED' } } },
    include: { productVariant: { include: { product: true } } },
  });
  const productSales: Record<string, { name: string, sold: number }> = {};
  for (const item of items) {
    const name = item.productVariant?.product?.name || 'Unknown';
    productSales[name] = productSales[name] || { name, sold: 0 };
    productSales[name].sold += item.quantity;
  }
  const data = Object.values(productSales).sort((a, b) => b.sold - a.sold).slice(0, 5);
  return NextResponse.json(data);
} 