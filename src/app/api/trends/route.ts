import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get categories with most products
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        products: {
          _count: 'desc',
        },
      },
      take: 4,
    });

    // Transform the data to include mock images for now
    // In a real app, you would store these in your database
    const trendImages = [
      '/images/trends/summer-fashion.jpg',
      '/images/trends/vintage-style.jpg',
      '/images/trends/sports-fashion.jpg',
      '/images/trends/office-style.jpg',
    ];

    const trends = categories.map((category, index) => ({
      id: category.id,
      name: category.name,
      productCount: category._count.products,
      image: trendImages[index] || '/images/trends/default.jpg',
    }));

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 