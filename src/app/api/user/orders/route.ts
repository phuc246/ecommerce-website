import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const statusParam = url.searchParams.get('status');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Validate and convert status string to enum if provided
    let statusFilter = undefined;
    if (statusParam) {
      // Check if the status is valid
      const isValidStatus = Object.values(OrderStatus).includes(statusParam as OrderStatus);
      if (isValidStatus) {
        statusFilter = statusParam as OrderStatus;
      }
    }
    
    // Build the where clause
    const where = {
      userId: session.user.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    };
    
    // Fetch orders with pagination
    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
          address: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);
    
    return NextResponse.json({
      orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 