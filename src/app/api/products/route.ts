import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  description: z.string().min(1, "Mô tả là bắt buộc"),
  price: z.number().min(0, "Giá phải lớn hơn 0"),
  image: z.string().min(1, "Hình ảnh là bắt buộc"),
  categoryId: z.string().min(1, "Danh mục là bắt buộc"),
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
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
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
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
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
    const { name, description, price, categoryId, stock, color, size, image } = body;

    if (!name || !description || !price || !categoryId || !stock || !color || !size || !image) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId,
        stock: parseInt(stock),
        color,
        size,
        image,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
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

    const validatedData = productSchema.parse({
      ...data,
      price: parseFloat(data.price),
    });

    const product = await prisma.product.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(product);
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