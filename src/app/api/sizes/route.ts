import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Lấy tất cả size
    const sizes = await prisma.size.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Lọc trùng name phía server
    const uniqueSizesMap = new Map();
    sizes.forEach((size) => {
      if (!uniqueSizesMap.has(size.name)) {
        uniqueSizesMap.set(size.name, size);
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