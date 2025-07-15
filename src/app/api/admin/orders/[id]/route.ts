import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
      items: { include: { productVariant: { include: { product: true } } } },
    },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({
    ...order,
    shippingFee: order.shippingFee,
    discountAmount: order.discountAmount,
    promotionCode: order.promotionCode,
    subtotal: order.subtotal,
    cancelRejectedAt: order.cancelRejectedAt,
    cancelRejectReason: order.cancelRejectReason,
    cancelRequestedAt: order.cancelRequestedAt,
    cancelledAt: order.cancelledAt,
    deliveredAt: order.deliveredAt,
    shippedAt: order.shippedAt,
    processingAt: order.processingAt,
    pendingAt: order.pendingAt,
    createdAt: order.createdAt,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { status, cancelReason } = body;
  const oldOrder = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  const now = new Date();
  const statusFieldMap: Record<string, string> = {
    PENDING: 'pendingAt',
    PROCESSING: 'processingAt',
    SHIPPED: 'shippedAt',
    DELIVERED: 'deliveredAt',
    CANCELLED: 'cancelledAt',
    CANCELED: 'cancelledAt',
  };
  const updateData: any = { status };
  const field = statusFieldMap[status];
  if (field) updateData[field] = now;

  // Nếu huỷ đơn, bắt buộc nhập lý do và hoàn trả tồn kho
  if (status === 'CANCELLED') {
    if (!cancelReason || cancelReason.trim() === '') {
      return NextResponse.json({ error: 'Lý do huỷ đơn hàng là bắt buộc.' }, { status: 400 });
    }
    updateData.cancelReason = cancelReason;
    // Hoàn trả tồn kho
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: params.id },
        data: updateData,
      });
      for (const item of oldOrder?.items || []) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    });
    // Ghi log
    await prisma.log.create({
      data: {
        adminId: session.user.id,
        action: 'Cập nhật trạng thái đơn hàng',
        entity: 'order',
        entityId: params.id,
        details: {
          code: oldOrder?.id,
          before: oldOrder?.status,
          after: status,
        },
        level: 'INFO',
        message: `Cập nhật trạng thái đơn hàng ${oldOrder?.id} từ ${oldOrder?.status} sang ${status}`,
      },
    });
    // Lấy lại order mới
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    return NextResponse.json(order);
  }

  // Nếu admin từ chối huỷ (status === 'CANCEL_REJECTED')
  if (status === 'CANCEL_REJECTED') {
    const rejectReason = cancelReason || 'Shop từ chối huỷ vì đơn hàng đã vận chuyển';
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'SHIPPED',
        shippedAt: now,
        cancelRejectedAt: now,
        cancelRejectReason: rejectReason,
      },
    });
    await prisma.log.create({
      data: {
        adminId: session.user.id,
        action: 'Từ chối huỷ đơn hàng',
        entity: 'order',
        entityId: params.id,
        details: {
          code: order.id,
          before: oldOrder?.status,
          after: 'SHIPPED',
        },
        level: 'INFO',
        message: `Shop từ chối huỷ đơn hàng ${order.id} vì đã vận chuyển`,
      },
    });
    return NextResponse.json(order);
  }

  // Nếu không phải huỷ, giữ logic cũ
  let order;
  await prisma.$transaction(async (tx) => {
    order = await tx.order.update({
      where: { id: params.id },
      data: updateData,
    });
    // Nếu chuyển sang DELIVERED, tăng sold cho từng sản phẩm/biến thể
    if (status === 'DELIVERED' && oldOrder?.items) {
      for (const item of oldOrder.items) {
        // Tăng sold cho productVariant
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { sold: { increment: item.quantity } },
        });
      }
    }
    await tx.log.create({
      data: {
        adminId: session.user.id,
        action: 'Cập nhật trạng thái đơn hàng',
        entity: 'order',
        entityId: params.id,
        details: {
          code: order.id,
          before: oldOrder?.status,
          after: status,
        },
        level: 'INFO',
        message: `Cập nhật trạng thái đơn hàng ${order.id} từ ${oldOrder?.status} sang ${status}`,
      },
    });
  });
  return NextResponse.json(order);
} 