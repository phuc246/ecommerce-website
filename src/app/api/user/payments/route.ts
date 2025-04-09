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
    
    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
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
    
    const data = await request.json();
    const { type, isDefault, ...paymentDetails } = data;
    
    if (!type) {
      return NextResponse.json(
        { error: 'Payment type is required' },
        { status: 400 }
      );
    }
    
    // Validate required fields based on payment type
    if (type === 'credit_card') {
      const { cardNumber, cardHolder, expiryDate } = paymentDetails;
      if (!cardNumber || !cardHolder || !expiryDate) {
        return NextResponse.json(
          { error: 'Card information is incomplete' },
          { status: 400 }
        );
      }
    } else if (type === 'bank_transfer') {
      const { bankName, accountNumber } = paymentDetails;
      if (!bankName || !accountNumber) {
        return NextResponse.json(
          { error: 'Bank information is incomplete' },
          { status: 400 }
        );
      }
    }
    
    // If this is the default payment method, unset any existing default
    if (isDefault) {
      await prisma.payment.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
    
    // If this is the first payment method, make it default regardless of what was set
    const paymentCount = await prisma.payment.count({
      where: { userId: session.user.id },
    });
    
    const isFirstPayment = paymentCount === 0;
    
    const newPayment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        type,
        isDefault: isFirstPayment ? true : !!isDefault,
        ...paymentDetails,
      },
    });
    
    return NextResponse.json(newPayment);
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 