import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { fullName, phone, address, city, district, ward, isDefault } = await request.json();
    
    if (!fullName || !phone || !address || !city || !district || !ward) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // If this is the default address, unset any existing default address
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
    
    // If this is the first address, make it default regardless of what was set
    const addressCount = await prisma.address.count({
      where: { userId: session.user.id },
    });
    
    const isFirstAddress = addressCount === 0;
    
    const newAddress = await prisma.address.create({
      data: {
        userId: session.user.id,
        fullName,
        phone,
        address,
        city,
        district,
        ward,
        isDefault: isFirstAddress ? true : isDefault,
      },
    });
    
    return NextResponse.json(newAddress);
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 