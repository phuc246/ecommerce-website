import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Lấy danh sách log (mới nhất trước)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");

    const whereClause = entity ? { entity, entityId: { not: '' } } : { entityId: { not: '' } };

    const logs = await prisma.log.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { admin: { select: { email: true } } },
    });
    // Map lại để trả về userEmail
    const logsWithUserEmail = logs.map(log => ({
      ...log,
      userEmail: log.admin?.email || null,
    }));
    return NextResponse.json(logsWithUserEmail);
  } catch (error) {
    console.error("LOG API ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

// POST: Ghi log mới
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { action, entity, entityId, detail } = body;
    await prisma.log.create({
      data: {
        adminId: session?.user?.id || null,
        action,
        entity,
        entityId: entityId || null,
        details: detail || null,
        level: 'INFO',
        message: action + ' ' + (entity || ''),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
} 