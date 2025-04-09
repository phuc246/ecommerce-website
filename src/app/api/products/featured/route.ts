import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get up to 8 products with the highest stock as featured products
    // In a real application, you might have a 'featured' field in the database
    // or use other criteria like newest, most sold, etc.
    const featuredProducts = await prisma.product.findMany({
      take: 8,
      orderBy: {
        stock: 'desc', // Use stock as a simple way to determine "featured" products
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(featuredProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 