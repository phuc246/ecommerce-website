import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const trends = await prisma.trend.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If no trends are found, return default data
    if (!trends || trends.length === 0) {
      return NextResponse.json([
        {
          id: '1',
          name: 'Thời Trang Mùa Hè',
          image: '/images/trends/summer-fashion.jpg',
          productCount: 24,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Phong Cách Vintage',
          image: '/images/trends/vintage-style.jpg',
          productCount: 18,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          name: 'Thời Trang Thể Thao',
          image: '/images/trends/sports-fashion.jpg',
          productCount: 32,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          name: 'Phong Cách Công Sở',
          image: '/images/trends/office-style.jpg',
          productCount: 15,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }

    return NextResponse.json(trends);
  } catch (error) {
    console.error("Error fetching trends:", error);
    
    // Return fallback data instead of an error
    return NextResponse.json([
      {
        id: '1',
        name: 'Thời Trang Mùa Hè',
        image: '/images/trends/summer-fashion.jpg',
        productCount: 24,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Phong Cách Vintage',
        image: '/images/trends/vintage-style.jpg',
        productCount: 18,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: 'Thời Trang Thể Thao',
        image: '/images/trends/sports-fashion.jpg',
        productCount: 32,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        name: 'Phong Cách Công Sở',
        image: '/images/trends/office-style.jpg',
        productCount: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, image, productCount } = data;

    if (!name || !image) {
      return NextResponse.json(
        { error: "Name and image are required" },
        { status: 400 }
      );
    }

    const newTrend = await prisma.trend.create({
      data: {
        name,
        image,
        productCount: productCount || 0
      }
    });

    return NextResponse.json(newTrend, { status: 201 });
  } catch (error) {
    console.error("Error creating trend:", error);
    return NextResponse.json(
      { error: "Failed to create trend" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 