import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: Lấy danh sách đánh giá cho sản phẩm
export async function GET(req: Request, { params }: { params: { productId: string } }) {
  const { productId } = params;
  const { searchParams } = new URL(req.url);
  const productVariantId = searchParams.get('productVariantId');
  try {
    let reviews = await prisma.review.findMany({
      where: {
        productId,
        ...(productVariantId ? { productVariantId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        productVariant: { select: { image: true, color: true, size: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Lấy thông tin biến thể từ OrderItem (ảnh, màu, size tại thời điểm mua)
    const reviewWithOrderVariant = await Promise.all(reviews.map(async (r) => {
      let orderItem = null;
      if (r.orderId && r.productVariantId) {
        orderItem = await prisma.orderItem.findFirst({
          where: { orderId: r.orderId, productVariantId: r.productVariantId },
          select: {
            productVariant: { select: { image: true, color: true, size: true } }
          }
        });
      }
      return {
        ...r,
        orderVariant: orderItem?.productVariant || null
      };
    }));

    return NextResponse.json(reviewWithOrderVariant);
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
  const { rating, comment, orderId, hideName, productVariantId } = await req.json();
  if (!rating) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
  }
  try {
    // Kiểm tra đã có review cho sản phẩm này trong đơn hàng này chưa
    const existing = await prisma.review.findFirst({
      where: {
        productId,
        productVariantId,
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
        productVariantId,
        userId: session.user.id,
        orderId,
        rating,
        comment,
        hideName: !!hideName,
      },
    });
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi gửi đánh giá' }, { status: 500 });
  }
} 