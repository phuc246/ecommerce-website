import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { productAttributes: { include: { attribute: true } } } } },
  });
  return NextResponse.json(wishlist.map((w: any) => ({
    id: w.product.id,
    name: w.product.name,
    image: w.product.image,
    price: typeof w.product.price === 'number' ? w.product.price : 0,
    attributes: w.product.productAttributes?.map((pa: any) => pa.attribute) || [],
  })));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }
    
    const { productId } = await req.json();
    
    // Validate productId
    if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
      return NextResponse.json({ error: 'Thiếu productId hoặc productId không hợp lệ.' }, { status: 400 });
    }
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Sản phẩm không tồn tại.' }, { status: 404 });
    }
    
    // Check if already in wishlist
    const existingWishlist = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });
    
    if (existingWishlist) {
      return NextResponse.json({ 
        success: true, 
        message: 'Sản phẩm đã có trong danh sách yêu thích' 
      });
    }
    
    // Add to wishlist
    await prisma.wishlist.create({
      data: { userId: session.user.id, productId },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Đã thêm vào danh sách yêu thích' 
    });
  } catch (error) {
    console.error('[WISHLIST_ADD]', error);
    return NextResponse.json({ error: 'Lỗi khi thêm vào danh sách yêu thích' }, { status: 500 });
  }
} 