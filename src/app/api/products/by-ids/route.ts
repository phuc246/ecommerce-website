import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const byIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Danh sách ID không được rỗng"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = byIdsSchema.parse(body);
    const { ids } = validatedData;

    // Validate IDs are not empty
    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: "Danh sách ID không được rỗng" },
        { status: 400 }
      );
    }

    // Validate all IDs are valid strings
    if (!ids.every(id => typeof id === 'string' && id.trim().length > 0)) {
      return NextResponse.json(
        { error: "Tất cả ID phải là chuỗi hợp lệ" },
        { status: 400 }
      );
    }

    // Fetch products with all necessary relations
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        category: true,
        productAttributes: {
          include: {
            attribute: true,
          },
        },
        variants: {
          where: {
            stock: { gt: 0 }, // Only variants with stock > 0
          },
          orderBy: {
            price: 'asc', // Order by price ascending
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Latest products first
      },
    });

    // Transform data to match frontend expectations
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.variants?.[0]?.price || 0,
      salePrice: product.variants?.[0]?.salePrice || null,
      category: product.category,
      attributes: product.productAttributes?.map((pa: any) => pa.attribute) || [],
      variants: product.variants || [],
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error("[PRODUCTS_BY_IDS]", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Lỗi server nội bộ" },
      { status: 500 }
    );
  }
} 