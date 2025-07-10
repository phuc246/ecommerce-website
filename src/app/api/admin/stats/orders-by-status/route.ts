import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const group = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const data = group.map(g => ({ status: g.status, count: g._count._all }));
  return NextResponse.json(data);
} 