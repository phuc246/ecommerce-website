import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
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

    // Start a transaction to update order status and restore stock
    await prisma.$transaction(async (tx) => {
      // Update order status to CANCELLED
      await tx.order.update({
        where: { id: params.id },
        data: { status: "CANCELLED" },
      });

      // Restore product stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    });

    return NextResponse.json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("[ORDER_CANCEL]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 