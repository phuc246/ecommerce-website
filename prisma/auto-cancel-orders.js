// Script tự động huỷ đơn hàng CANCEL_REQUESTED quá 24h
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function autoCancelOrders() {
  const now = new Date();
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: 'CANCEL_REQUESTED',
      cancelRequestedAt: {
        not: null,
        lte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // quá 24h
      },
    },
    include: { items: true },
  });

  for (const order of expiredOrders) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: 'Tự động huỷ do admin không xác nhận trong 24h',
        },
      });
      for (const item of order.items) {
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
    console.log(`Đã tự động huỷ đơn hàng ${order.id}`);
  }
}

autoCancelOrders().finally(() => prisma.$disconnect()); 