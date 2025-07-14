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

    // Only show products with at least one variant in stock
    where.variants = { some: { stock: { gt: 0 } } };

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
          variants: true,
          productAttributes: {
            include: {
              attribute: {
                select: { id: true, name: true }
              }
            }
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    // Map lại để thêm salePrice (lấy giá nhỏ nhất trong các variants nếu có, hoặc undefined)
    const productsWithVariants = products.map(product => {
      // Gom nhóm các variant theo color
      const variantGroups: Record<string, { color: string; image?: string; sku?: string; sizes: any[] }> = {};
      for (const v of product.variants) {
        const key = v.color;
        if (!variantGroups[key]) {
          variantGroups[key] = {
            color: v.color,
            image: v.image ?? undefined,
            sku: v.sku ?? undefined,
            sizes: [],
          };
        }
        variantGroups[key].sizes.push({
          size: v.size,
          stock: v.stock,
          price: v.price,
          salePrice: v.salePrice,
        });
      }
      // Lấy màu không trùng lặp
      let colors: { name: string; value: string }[] = [];
      const colorMap = new Map();
      for (const v of product.variants) {
        if (v.color) {
          const key = v.color;
          if (!colorMap.has(key)) {
            colorMap.set(key, { name: v.color, value: v.color });
          }
        }
      }
      colors = Array.from(colorMap.values());
      // Lấy attributes từ productAttributes
      const attributes = product.productAttributes?.map(pa => ({
        id: pa.attribute.id,
        name: pa.attribute.name
      })) || [];
      // Giá min/max
      let minPrice, maxPrice, minSalePrice, maxSalePrice;
      if (product.variants && product.variants.length > 0) {
        const prices = product.variants.map(v => v.price).filter((p): p is number => typeof p === 'number' && p > 0);
        const salePrices = product.variants.map(v => v.salePrice).filter((p): p is number => typeof p === 'number' && p > 0);
        if (prices.length > 0) {
          minPrice = Math.min(...prices);
          maxPrice = Math.max(...prices);
        }
        if (salePrices.length > 0) {
          minSalePrice = Math.min(...salePrices);
          maxSalePrice = Math.max(...salePrices);
        }
      }
      return {
        ...product,
        variants: Object.values(variantGroups),
        minPrice,
        maxPrice,
        minSalePrice,
        maxSalePrice,
        colors,
        attributes,
      };
    });

    return NextResponse.json({
      products: productsWithVariants,
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