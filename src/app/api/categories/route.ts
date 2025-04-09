import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  image: z.string().optional(),
});

// GET all categories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const search = searchParams.get("search") || "";

    // Find categories with optional filtering
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        orderBy: {
          name: "asc",
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.category.count({
        where: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      }),
    ]);

    // For each category, count the number of products
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await prisma.product.count({
          where: { categoryId: category.id },
        });
        return {
          ...category,
          productCount,
        };
      })
    );

    return NextResponse.json(
      searchParams.has("page")
        ? {
            categories: categoriesWithCounts,
            pagination: {
              total,
              pages: Math.ceil(total / limit),
              page,
              limit,
            },
          }
        : categoriesWithCounts
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Lỗi khi tải danh mục" },
      { status: 500 }
    );
  }
}

// POST create a new category (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate request
    const validation = categorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Create new category
    const category = await prisma.category.create({
      data: {
        name: body.name,
        image: body.image || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Lỗi khi tạo danh mục" },
      { status: 500 }
    );
  }
}

// PUT update a category (admin only)
export async function PUT(request: Request) {
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
        { error: "ID danh mục là bắt buộc" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request
    const validation = categorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Danh mục không tồn tại" },
        { status: 404 }
      );
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        image: body.image || null,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật danh mục" },
      { status: 500 }
    );
  }
}

// DELETE a category (admin only)
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
        { error: "ID danh mục là bắt buộc" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Danh mục không tồn tại" },
        { status: 404 }
      );
    }

    // Check if category has products
    if (existingCategory.products.length > 0) {
      return NextResponse.json(
        { error: "Không thể xóa danh mục có sản phẩm" },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa danh mục" },
      { status: 500 }
    );
  }
} 