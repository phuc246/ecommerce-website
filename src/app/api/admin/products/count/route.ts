import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the category from the query string
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    // Base query
    const baseQuery: any = {};

    // Add category filter if provided
    if (category) {
      // For "summer" category, we could look for products with specific keywords in name or description
      if (category === 'summer') {
        baseQuery.OR = [
          { name: { contains: 'summer', mode: 'insensitive' } },
          { name: { contains: 'hè', mode: 'insensitive' } },
          { description: { contains: 'summer', mode: 'insensitive' } },
          { description: { contains: 'hè', mode: 'insensitive' } }
        ];
      } else {
        // Otherwise, we look for an exact category match
        baseQuery.category = {
          name: { contains: category, mode: 'insensitive' }
        };
      }
    }

    // Count products
    const count = await prisma.product.count({
      where: baseQuery
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting products:', error);
    return NextResponse.json(
      { error: 'Failed to count products' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 