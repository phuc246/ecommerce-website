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

    // Get the original order
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

    // Check if user has an existing cart
    let cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
    });

    // Create a new cart if user doesn't have one
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    // Add items to cart
    for (const item of order.items) {
      // Check if product is still available and has enough stock
      const product = item.product;
      if (!product || product.stock < item.quantity) {
        continue; // Skip unavailable items
      }

      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: item.productId,
        },
      });

      if (existingItem) {
        // Update quantity if item exists
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + item.quantity,
          },
        });
      } else {
        // Create new cart item if it doesn't exist
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
          },
        });
      }
    }

    return NextResponse.json({ cartId: cart.id });
  } catch (error) {
    console.error("[ORDER_REORDER]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 