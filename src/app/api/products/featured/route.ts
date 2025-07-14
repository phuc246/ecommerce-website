import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Lấy top 12 productId bán chạy nhất (tổng số lượng đã bán, chỉ tính đơn DELIVERED)
    const topOrderItems = await prisma.orderItem.findMany({
      where: { order: { status: 'DELIVERED' } },
      include: { productVariant: { include: { product: true } } },
    });
    // Gom nhóm theo productId và tính tổng số lượng bán
    const productSales: Record<string, { product: any, sold: number }> = {};
    for (const item of topOrderItems) {
      const product = item.productVariant?.product;
      if (!product) continue;
      const id = product.id;
      if (!productSales[id]) productSales[id] = { product, sold: 0 };
      productSales[id].sold += item.quantity;
    }
    // Sắp xếp và lấy 12 sản phẩm bán chạy nhất
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 12)
      .map(p => p.product.id);
    // Lấy chi tiết sản phẩm
    const products = await prisma.product.findMany({
      where: { id: { in: topProducts } },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
    // Đảm bảo đúng thứ tự bán chạy và thêm trường sold vào từng sản phẩm
    const orderedProducts = topProducts.map(id => {
      const found = products.find(p => p.id === id);
      if (!found) return null;
      const sold = productSales[id]?.sold || 0;
      return { ...found, sold };
    }).filter(Boolean);
    return NextResponse.json(orderedProducts);
  } catch (error) {
    console.error('Error fetching best-selling products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch best-selling products' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 