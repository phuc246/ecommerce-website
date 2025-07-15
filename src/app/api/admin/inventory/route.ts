import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Lấy tất cả sản phẩm và các variant
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      category: true,
    },
  });
  // Group lại theo sản phẩm > màu > size
  const result = products.map(product => {
    // Gom các variant theo màu
    const colorMap: Record<string, any> = {};
    product.variants.forEach(variant => {
      const colorKey = variant.color;
      if (!colorMap[colorKey]) {
        colorMap[colorKey] = {
          color: variant.color,
          image: variant.image || product.image,
          price: variant.price,
          salePrice: variant.salePrice,
          sku: variant.sku,
          productName: product.name,
          productId: product.id,
          category: product.category?.name || '',
          sizes: [],
        };
      }
      colorMap[colorKey].sizes.push({
        id: variant.id,
        size: variant.size,
        stock: variant.stock,
        sku: variant.sku,
      });
    });
    return {
      productId: product.id,
      productName: product.name,
      colors: Object.values(colorMap),
    };
  });
  return NextResponse.json(result);
} 