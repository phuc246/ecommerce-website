import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { stock } = await req.json();
  if (typeof stock !== 'number' || stock < 0) {
    return NextResponse.json({ error: 'Invalid stock value' }, { status: 400 });
  }
  // Lấy thông tin variant cũ trước khi cập nhật
  const oldVariant = await prisma.productVariant.findUnique({
    where: { id: params.id },
    include: { product: true },
  });
  const updated = await prisma.productVariant.update({
    where: { id: params.id },
    data: { stock },
  });
  // Ghi log thao tác cập nhật tồn kho
  await prisma.log.create({
    data: {
      adminId: session.user.id,
      level: 'INFO',
      action: 'UPDATE',
      entity: 'inventory',
      entityId: params.id,
      message: `Cập nhật tồn kho: ${oldVariant?.product?.name || ''} - ${oldVariant?.color || ''} - Size ${oldVariant?.size || ''}: ${oldVariant?.stock ?? '?'} -> ${stock}`,
      details: JSON.stringify({
        productName: oldVariant?.product?.name,
        color: oldVariant?.color,
        size: oldVariant?.size,
        oldStock: oldVariant?.stock,
        newStock: stock,
        variantId: params.id,
      }),
    },
  });
  return NextResponse.json(updated);
}
