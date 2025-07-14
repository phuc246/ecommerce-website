import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để đặt hàng' }, { status: 401 });
    }
    
    const body = await request.json();
    const { items, shippingAddress, paymentMethod, phone, promotionCode } = body;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Giỏ hàng trống' }, { status: 400 });
    }
    
    if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length === 0) {
      return NextResponse.json({ error: 'Địa chỉ giao hàng không được để trống' }, { status: 400 });
    }
    
    if (!paymentMethod || typeof paymentMethod !== 'string' || paymentMethod.trim().length === 0) {
      return NextResponse.json({ error: 'Phương thức thanh toán không được để trống' }, { status: 400 });
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.productVariantId || !item.quantity || !item.price) {
        return NextResponse.json({ error: 'Thông tin sản phẩm không đầy đủ' }, { status: 400 });
      }
      
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json({ error: 'Số lượng sản phẩm phải là số dương' }, { status: 400 });
      }
      
      if (typeof item.price !== 'number' || item.price < 0) {
        return NextResponse.json({ error: 'Giá sản phẩm không hợp lệ' }, { status: 400 });
      }
    }
    // Lấy thông tin biến thể và kiểm tra tồn kho
    const variantIds = items.map((item: any) => item.productVariantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });
    // Kiểm tra tồn kho
    for (const item of items) {
      const variant = variants.find(v => v.id === item.productVariantId);
      if (!variant) {
        return NextResponse.json({ error: `Không tìm thấy biến thể sản phẩm: ${item.productVariantId}` }, { status: 400 });
      }
      if (variant.stock <= 0) {
        return NextResponse.json({ error: `Sản phẩm ${variant.product.name} (${variant.color} - ${variant.size}) đã hết hàng` }, { status: 400 });
      }
      if (variant.stock < item.quantity) {
        return NextResponse.json({ error: `Chỉ còn ${variant.stock} sản phẩm ${variant.product.name} (${variant.color} - ${variant.size}) trong kho` }, { status: 400 });
      }
    }
    // Tạo đơn hàng và trừ kho
    const order = await prisma.$transaction(async (tx) => {
      // Trừ kho và ghi log
      for (const item of items) {
        const variant = variants.find(v => v.id === item.productVariantId);
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { decrement: item.quantity } },
        });
        // Ghi log
        await tx.log.create({
          data: {
            level: 'INFO',
            message: `Trừ ${item.quantity} ${variant?.product.name} ${variant?.color} ${variant?.size} khi tạo đơn #TEMP`,
            action: 'INVENTORY_DECREASE',
            entity: 'ProductVariant',
            entityId: item.productVariantId,
            adminId: session.user.id,
          },
        });
      }
      // Trước khi tính tổng tiền:
      let discountAmount = 0;
      let promotion = null;
      if (promotionCode) {
        // Kiểm tra mã giảm giá hợp lệ
        const now = new Date();
        promotion = await prisma.promotion.findFirst({
          where: {
            code: promotionCode,
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
          },
        });
        if (!promotion) {
          return NextResponse.json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn!' }, { status: 400 });
        }
      }
      // Tính tổng tiền
      let subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      let total = subtotal;
      let shippingFee = 30000;
      if (promotion) {
        if (promotion.discountType === 'PERCENTAGE') {
          discountAmount = Math.round(subtotal * promotion.discountValue / 100);
        } else if (promotion.discountType === 'FIXED_AMOUNT') {
          discountAmount = Math.round(promotion.discountValue);
        }
        total = Math.max(0, subtotal - discountAmount);
      }
      total = total + shippingFee;
      // Tạo đơn hàng
      const createdOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total,
          status: 'PENDING',
          shippingAddress,
          paymentMethod,
          phone: phone || null,
          pendingAt: new Date(),
          promotionCode: promotion ? promotion.code : null,
          discountAmount: promotion ? discountAmount : null,
          shippingFee,
          subtotal,
          items: {
            create: items.map((item: any) => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              productVariant: { include: { product: true } },
            },
          },
        },
      });
      // Sau khi tạo đơn, cập nhật lại log với orderId thật
      for (const item of items) {
        await tx.log.updateMany({
          where: {
            entity: 'ProductVariant',
            entityId: item.productVariantId,
            message: { contains: '#TEMP' },
          },
          data: {
            message: {
              set: `Trừ ${item.quantity} ${variants.find(v => v.id === item.productVariantId)?.product.name} ${variants.find(v => v.id === item.productVariantId)?.color} ${variants.find(v => v.id === item.productVariantId)?.size} khi tạo đơn #${createdOrder.id}`,
            },
          },
        });
      }
      return createdOrder;
    });
    // Chuẩn hóa dữ liệu trả về
    const orderItems = order.items.map(item => ({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      price: item.price,
      color: item.productVariant.color,
      size: item.productVariant.size,
      name: item.productVariant.product.name,
      sku: item.productVariant.sku,
    }));
    return NextResponse.json({
      id: order.id,
      total: order.total,
      status: order.status,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      items: orderItems,
      createdAt: order.createdAt,
      promotionCode: order.promotionCode,
      discountAmount: order.discountAmount,
      shippingFee: order.shippingFee,
      subtotal: order.subtotal,
    });
  } catch (error) {
    console.error('[ORDER_CREATE]', error);
    return NextResponse.json({ error: error?.message || 'Internal error', detail: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 });
    }
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            productVariant: { include: { product: true } },
          },
        },
      },
    });
    // Chuẩn hóa dữ liệu trả về cho OrderHistoryTab
    const result = orders.map(order => ({
      id: order.id,
      userId: order.userId,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productVariant.product.id,
        orderId: item.orderId,
        name: item.productVariant.product.name,
        price: item.price,
        quantity: item.quantity,
        color: item.productVariant.color,
        size: item.productVariant.size,
        image: item.productVariant.product.image,
        salePrice: item.productVariant.salePrice ?? null,
        product: {
          id: item.productVariant.product.id,
          name: item.productVariant.product.name,
          image: item.productVariant.product.image,
        },
      })),
    }));
    return NextResponse.json(result);
  } catch (error) {
    console.error('[ORDER_LIST_USER]', error);
    return NextResponse.json([], { status: 500 });
  }
} 