import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/promotions/active
export async function GET() {
  try {
    const now = new Date();
    const activePromotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        startDate: true,
        endDate: true,
        isActive: true,
        usageLimit: true,
        timesUsed: true,
        createdAt: true,
        updatedAt: true,
        title: true,
        description: true,
        backgroundImage: true,
      },
    });
    return NextResponse.json(activePromotions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch active promotions" }, { status: 500 });
  }
} 