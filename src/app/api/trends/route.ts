import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const trends = await prisma.trend.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        productTrends: true
      }
    });

    // Thêm productCount cho mỗi trend
    const trendsWithCount = trends.map(trend => ({
      ...trend,
      productCount: trend.productTrends.length
    }));

    return NextResponse.json(trendsWithCount);
  } catch (error) {
    console.error("Error fetching trends:", error);
    // Nếu lỗi, trả về mảng rỗng
    return NextResponse.json([]);
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const data = await request.json();
    const { name, image, productCount } = data;

    if (!name || !image) {
      return NextResponse.json(
        { error: "Name and image are required" },
        { status: 400 }
      );
    }

    const newTrend = await prisma.trend.create({
      data: {
        name,
        image,
        productCount: productCount || 0
      }
    });

    // Ghi log tạo trend
    const admin = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
    await prisma.log.create({
      data: {
        adminId: admin ? admin.id : null,
        userEmail: admin ? admin.email : null,
        action: 'CREATE',
        entity: 'trend',
        entityId: newTrend.id,
        details: JSON.stringify({ name: newTrend.name, changes: { after: { name: newTrend.name } }, adminEmail: admin ? admin.email : null }),
        level: 'INFO',
        message: 'CREATE trend',
      },
    });

    return NextResponse.json(newTrend, { status: 201 });
  } catch (error) {
    console.error("Error creating trend:", error);
    return NextResponse.json(
      { error: "Failed to create trend" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 