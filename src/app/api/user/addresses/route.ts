import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 200 });
  }
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }
    const body = await request.json();
    const { fullName, phone, address, city, district, ward, isDefault } = body;
    if (!fullName || !phone || !address || !city || !district || !ward) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin địa chỉ' }, { status: 400 });
    }
    // Nếu là địa chỉ đầu tiên, luôn đặt isDefault=true
    const count = await prisma.address.count({ where: { userId: session.user.id } });
    const addressData = {
      userId: session.user.id,
      fullName,
      phone,
      address,
      city,
      district,
      ward,
      isDefault: count === 0 ? true : !!isDefault,
    };
    if (addressData.isDefault) {
      // Bỏ default các địa chỉ khác
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }
    const newAddress = await prisma.address.create({ data: addressData });
    return NextResponse.json(newAddress);
  } catch (error) {
    console.error('[ADDRESS_CREATE]', error);
    return NextResponse.json({ error: 'Lỗi khi lưu địa chỉ' }, { status: 500 });
  }
} 