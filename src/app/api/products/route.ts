import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  description: z.string().min(1, "Mô tả là bắt buộc"),
  image: z.string().min(1, "Hình ảnh là bắt buộc"),
  categoryId: z.string().min(1, "Danh mục là bắt buộc"),
  images: z.array(z.string()).optional(),
  variants: z.array(
    z.object({
      color: z.string(),
      colorHex: z.string().optional(),
      image: z.string().optional(),
      sku: z.string().optional(),
      price: z.number().min(0),
      salePrice: z.number().min(0).optional(),
      sizes: z.array(
        z.object({
          size: z.string(),
          stock: z.number().int().nonnegative(),
        })
      ).min(1)
    })
  ).min(1)
});

// GET all products
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");

    const where = {
      AND: [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        },
        ...(categoryId ? [{ categoryId }] : []),
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Chuẩn hóa trả về: mỗi product có variants dạng group theo color, mỗi color có mảng sizes
    const productsWithVariants = products.map(product => {
      // Gom nhóm các variant theo color
      const variantGroups: Record<string, { color: string; colorHex?: string; image?: string; sku?: string; sizes: any[] }> = {};
      for (const v of product.variants) {
        const key = v.color + (v.colorHex || "");
        if (!variantGroups[key]) {
          variantGroups[key] = {
            color: v.color,
            colorHex: v.colorHex ?? undefined,
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
      return {
        ...product,
        variants: Object.values(variantGroups),
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

// POST new product
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = productSchema.parse(body);

    // Tạo product trước
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        images: data.images || [],
        categoryId: data.categoryId,
      },
    });

    // Tạo các variant
    const variantCreates = [];
    for (const variant of data.variants) {
      for (const sizeObj of variant.sizes) {
        variantCreates.push({
          productId: product.id,
          color: variant.color,
          colorHex: variant.colorHex,
          image: variant.image,
          sku: variant.sku,
          size: sizeObj.size,
          stock: sizeObj.stock,
          price: variant.price,
          salePrice: variant.salePrice,
        });
      }
    }
    await prisma.productVariant.createMany({ data: variantCreates });

    return NextResponse.json({ ...product, variants: data.variants });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Lỗi khi tạo sản phẩm:", error);
    return NextResponse.json(
      { error: "Không thể tạo sản phẩm" },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json(
        { error: "ID sản phẩm là bắt buộc" },
        { status: 400 }
      );
    }
    const validatedData = productSchema.parse(data);

    // Cập nhật product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        image: validatedData.image,
        images: validatedData.images || [],
        categoryId: validatedData.categoryId,
      },
    });

    // Xóa hết các variant cũ
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    // Tạo lại các variant mới
    const variantCreates = [];
    for (const variant of validatedData.variants) {
      for (const sizeObj of variant.sizes) {
        variantCreates.push({
          productId: id,
          color: variant.color,
          colorHex: variant.colorHex,
          image: variant.image,
          sku: variant.sku,
          size: sizeObj.size,
          stock: sizeObj.stock,
          price: variant.price,
          salePrice: variant.salePrice,
        });
      }
    }
    await prisma.productVariant.createMany({ data: variantCreates });

    return NextResponse.json({ ...product, variants: validatedData.variants });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật sản phẩm" },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID sản phẩm là bắt buộc" },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa sản phẩm" },
      { status: 500 }
    );
  }
} 