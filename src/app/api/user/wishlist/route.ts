import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: { product: true },
  });
  return NextResponse.json(wishlist.map((w: any) => ({
    id: w.product.id,
    name: w.product.name,
    image: w.product.image,
    price: typeof w.product.price === 'number' ? w.product.price : 0,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: 'Thiếu productId.' }, { status: 400 });
  await prisma.wishlist.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    update: {},
    create: { userId: session.user.id, productId },
  });
  return NextResponse.json({ success: true });
} 