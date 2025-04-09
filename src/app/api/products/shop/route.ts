import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET all products for the shop (public access)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    let where: Prisma.ProductWhereInput = {};
    
    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    // Handle price filters
    let priceFilter: Prisma.IntFilter | Prisma.FloatFilter | undefined = undefined;
    
    if (minPrice !== undefined) {
      priceFilter = { gte: minPrice };
    }
    
    if (maxPrice !== undefined) {
      priceFilter = priceFilter 
        ? { ...priceFilter, lte: maxPrice }
        : { lte: maxPrice };
    }
    
    if (priceFilter) {
      where.price = priceFilter;
    }
    
    // Only show products with stock > 0
    where.stock = { gt: 0 };

    // Validate sort parameters
    const allowedSortFields = ["createdAt", "price", "name"];
    const allowedSortOrders = ["asc", "desc"];
    
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const validSortOrder = allowedSortOrders.includes(sortOrder) ? sortOrder as Prisma.SortOrder : "desc" as Prisma.SortOrder;

    // Create orderBy object
    const orderBy: any = { [validSortBy]: validSortOrder };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          colors: {
            select: {
              id: true,
              name: true,
              value: true,
            },
          },
          sizes: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách sản phẩm" },
      { status: 500 }
    );
  }
} 