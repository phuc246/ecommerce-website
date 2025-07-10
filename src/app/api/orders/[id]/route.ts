import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: {
      user: true,
      items: { include: { productVariant: { include: { product: true } } } },
    },
  });

  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
  }

  const result = {
    ...order,
    shippingName: order.user?.name || '',
    shippingEmail: order.user?.email || '',
    items: order.items.map(item => ({
      ...item,
      productVariant: {
        ...item.productVariant,
        product: item.productVariant?.product || null,
      },
    })),
  };
  return new Response(JSON.stringify(result), { status: 200 });
} 