import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const orders = await prisma.order.findMany({ select: { createdAt: true, status: true } });
  const ordersByMonth: Record<string, number> = {};
  for (const order of orders) {
    if (order.status === 'CANCELLED') continue;
    const d = new Date(order.createdAt);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
  }
  const data = Object.entries(ordersByMonth).map(([month, orders]) => ({ month, orders }));
  return NextResponse.json(data);
} 