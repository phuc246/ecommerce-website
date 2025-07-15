import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const productId = params.id;
  await prisma.wishlist.deleteMany({ where: { userId: session.user.id, productId } });
  return NextResponse.json({ success: true });
} 