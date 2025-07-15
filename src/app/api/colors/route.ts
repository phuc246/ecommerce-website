import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Lấy danh sách màu duy nhất và ảnh đại diện từ productVariant
    const colors = await prisma.productVariant.findMany({
      distinct: ['color'],
      select: {
        color: true,
        image: true,
      },
      orderBy: {
        color: 'asc',
      },
    });
    return NextResponse.json(colors);
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colors' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 