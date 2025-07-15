import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  // Lấy doanh thu theo tháng từ đơn đã giao
  const orders = await prisma.order.findMany({
    where: { status: { not: 'CANCELLED' } },
    select: { total: true, createdAt: true },
  });
  // Group by tháng
  const revenueByMonth: Record<string, number> = {};
  for (const order of orders) {
    const d = new Date(order.createdAt);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(order.total);
  }
  const data = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }));
  return NextResponse.json(data);
} 