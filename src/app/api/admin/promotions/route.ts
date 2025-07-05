import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

// GET /api/admin/promotions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const promotions = await prisma.promotion.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(promotions);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/promotions
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, discountType, discountValue, startDate, endDate, isActive, usageLimit, backgroundImage } = body;

    if (!code || !discountType || discountValue === undefined || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Kiểm tra mã giảm giá còn hạn không được trùng
    const today = startOfDay(new Date());
    const existing = await prisma.promotion.findFirst({
      where: {
        code,
        endDate: {
          gte: today,
        },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Mã giảm giá này vẫn còn hiệu lực, không thể tạo trùng" }, { status: 400 });
    }

    const newPromotion = await prisma.promotion.create({
      data: {
        code,
        backgroundImage,
        discountType,
        discountValue: parseFloat(discountValue),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
      },
    });

    // Ghi log thao tác
    await prisma.log.create({
      data: {
        adminId: session.user.id,
        message: session.user.email,
        level: session.user.role,
        action: 'CREATE',
        entity: 'promotion',
        entityId: newPromotion.id,
        details: JSON.stringify(newPromotion),
      },
    });

    return NextResponse.json(newPromotion, { status: 201 });
  } catch (error) {
    console.error('CREATE PROMOTION ERROR:', error);
    return NextResponse.json({ error: "Failed to create promotion", detail: String(error) }, { status: 500 });
  }
} 