import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get unique colors from all products
    const colors = await prisma.color.findMany({
      distinct: ['value'],
      select: {
        id: true,
        name: true,
        value: true,
      },
      orderBy: {
        name: 'asc',
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