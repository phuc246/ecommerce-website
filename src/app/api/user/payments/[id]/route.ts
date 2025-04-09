import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }
    
    // Check if the payment method belongs to the user
    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
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
    
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }
    
    // Check if the payment method belongs to the user
    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
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
    
    // If this is being set as the default payment method, unset any existing default
    if (isDefault && !payment.isDefault) {
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
    
    const updatedPayment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        type,
        isDefault,
        ...paymentDetails,
      },
    });
    
    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }
    
    // Check if the payment method belongs to the user
    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // If this was the default payment method and there are other methods, make another one the default
    if (payment.isDefault) {
      const otherPayment = await prisma.payment.findFirst({
        where: {
          userId: session.user.id,
          id: { not: params.id },
        },
      });
      
      if (otherPayment) {
        await prisma.payment.update({
          where: { id: otherPayment.id },
          data: { isDefault: true },
        });
      }
    }
    
    await prisma.payment.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 