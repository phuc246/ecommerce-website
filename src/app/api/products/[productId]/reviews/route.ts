import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: Lấy danh sách đánh giá cho sản phẩm
export async function GET(req: Request, { params }: { params: { productId: string } }) {
  const { productId } = params;
  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi lấy đánh giá' }, { status: 500 });
  }
}

// POST: User gửi đánh giá cho sản phẩm
export async function POST(req: Request, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }
  const { productId } = params;
  const { rating, comment, orderId } = await req.json();
  if (!rating || !comment) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
  }
  try {
    // Kiểm tra đã có review cho sản phẩm này trong đơn hàng này chưa
    const existing = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
        orderId,
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi.' }, { status: 400 });
    }
    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        orderId,
        rating,
        comment,
      },
    });
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi gửi đánh giá' }, { status: 500 });
  }
} 