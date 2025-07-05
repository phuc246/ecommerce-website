import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      items: { include: { product: true } },
    },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { status } = await req.json();
  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json(order);
} 