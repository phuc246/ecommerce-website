import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const body = await request.json();
    const { items, shippingAddress, paymentMethod } = body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse('No items', { status: 400 });
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
        return new NextResponse(`Product variant not found: ${item.productVariantId}`, { status: 400 });
      }
      if (variant.stock < item.quantity) {
        return new NextResponse(`Not enough stock for ${variant.product.name} (${variant.color} - ${variant.size})`, { status: 400 });
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
      // Tính tổng tiền
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      // Tạo đơn hàng
      const createdOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total,
          status: 'PENDING',
          shippingAddress,
          paymentMethod,
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
    });
  } catch (error) {
    console.error('[ORDER_CREATE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json([]);
} 