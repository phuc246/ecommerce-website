import { NextResponse } from "next/server";
import { authOptions } from '@/lib/auth';
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            productVariant: true,
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if order can be cancelled
    if (order.status !== "PENDING" && order.status !== "PROCESSING") {
      return new NextResponse("Order cannot be cancelled", { status: 400 });
    }

    // Chuyển trạng thái sang CANCEL_REQUESTED, set cancelRequestedAt
    await prisma.order.update({
      where: { id: params.id },
      data: {
        status: "CANCEL_REQUESTED",
        cancelRequestedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Đã gửi yêu cầu huỷ đơn hàng, admin sẽ xác nhận trong 24h." });
  } catch (error) {
    console.error("[ORDER_CANCEL]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 