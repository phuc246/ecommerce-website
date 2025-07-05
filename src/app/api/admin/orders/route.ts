import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: { include: { productVariant: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(orders);
} 