import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Lấy tất cả size distinct từ ProductVariant
    const sizes = await prisma.productVariant.findMany({
      select: { size: true },
      distinct: ['size']
    });
    // Nếu muốn trả về mảng string:
    // const sizeList = sizes.map(s => s.size);

    // Lọc trùng name phía server
    const uniqueSizesMap = new Map();
    sizes.forEach((size) => {
      if (!uniqueSizesMap.has(size.size)) {
        uniqueSizesMap.set(size.size, size);
      }
    });
    const uniqueSizes = Array.from(uniqueSizesMap.values());

    return NextResponse.json(uniqueSizes);
  } catch (error) {
    console.error('Error fetching sizes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sizes' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 