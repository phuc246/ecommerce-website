import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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

  // Lấy tất cả review của user cho đơn này (1 user chỉ review 1 lần cho mỗi sản phẩm trong đơn)
  const reviews = await prisma.review.findMany({
    where: {
      orderId: order.id,
      userId: session.user.id,
    },
  });

  const result = {
    ...order,
    shippingName: order.user?.name || '',
    shippingEmail: order.user?.email || '',
    items: order.items.map(item => {
      // So khớp cả productId và productVariantId (nếu review có lưu variant)
      const review = reviews.find(r =>
        r.productId === item.productVariant.productId &&
        (
          // Nếu review có trường productVariantId thì so sánh, không thì chỉ so sánh productId
          (r.productVariantId ? r.productVariantId === item.productVariant.id : true)
        )
      );
      return {
        ...item,
        productVariant: {
          ...item.productVariant,
          product: item.productVariant?.product || null,
        },
        review: review || undefined,
      };
    }),
    shippingFee: order.shippingFee,
    discountAmount: order.discountAmount,
    promotionCode: order.promotionCode,
    subtotal: order.subtotal,
  };
  return new Response(JSON.stringify(result), { status: 200 });
} 