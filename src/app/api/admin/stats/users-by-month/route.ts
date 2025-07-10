import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({ select: { createdAt: true } });
  const usersByMonth: Record<string, number> = {};
  for (const user of users) {
    const d = new Date(user.createdAt);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    usersByMonth[month] = (usersByMonth[month] || 0) + 1;
  }
  const data = Object.entries(usersByMonth).map(([month, users]) => ({ month, users }));
  return NextResponse.json(data);
} 