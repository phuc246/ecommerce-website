import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const address = await prisma.address.findUnique({
      where: { id: params.id },
    });
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }
    
    // Check if the address belongs to the user
    if (address.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Reset any existing default address
    await prisma.address.updateMany({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
    
    // Set the new default address
    const updatedAddress = await prisma.address.update({
      where: { id: params.id },
      data: {
        isDefault: true,
      },
    });
    
    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error('Error setting default address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 