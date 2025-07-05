import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Category } from "@prisma/client";
import { z } from "zod";

interface CategoryWithCount extends Category {
  _count: { products: number };
  subcategories?: CategoryWithCount[];
  productCount?: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories: CategoryWithCount[] = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const categoryMap: Map<string, CategoryWithCount> = new Map();
    categories.forEach(c => {
      c.subcategories = [];
      categoryMap.set(c.id, c);
    });

    const tree: CategoryWithCount[] = [];
    categories.forEach(c => {
      if (c.parentId && categoryMap.has(c.parentId)) {
        const parent = categoryMap.get(c.parentId)!;
        if (parent.subcategories) {
            parent.subcategories.push(c);
        }
      } else {
        tree.push(c);
      }
    });

    const calculateProductCount = (category: CategoryWithCount): number => {
      let count = category._count.products;
      if (category.subcategories && category.subcategories.length > 0) {
        for (const sub of category.subcategories) {
          count += calculateProductCount(sub);
        }
      }
      category.productCount = count;
      return count;
    }

    tree.forEach(calculateProductCount);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  parentId: z.string().optional().nullable(),
  image: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId, image } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        parentId: parentId || null,
        image: image || null,
      },
    });

    // Ghi log thao tác
    await prisma.log.create({
      data: {
        adminId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        action: 'CREATE',
        entity: 'category',
        entityId: category.id,
        details: JSON.stringify({ name: category.name, changes: { after: { name: category.name } }, adminEmail: session?.user?.email || null }),
        level: 'INFO',
        message: `Tạo danh mục: ${category.name}`,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, name } = data;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 }
      );
    }

    // Lấy thông tin cũ
    const oldCategory = await prisma.category.findUnique({ where: { id } });
    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });
    // Debug trước khi ghi log
    console.log('GHI LOG CATEGORY UPDATE', { userId: session.user.id, id, oldCategory, category });
    try {
      const logResult = await prisma.log.create({
        data: {
          adminId: session?.user?.id || null,
          userEmail: session?.user?.email || null,
          level: 'INFO',
          message: `Cập nhật danh mục: ${category.name}`,
          action: 'UPDATE',
          entity: 'category',
          entityId: category.id,
          details: JSON.stringify({ name: category.name, changes: { before: { name: oldCategory?.name }, after: { name: category.name } }, adminEmail: session?.user?.email || null }),
        },
      });
      console.log('GHI LOG CATEGORY UPDATE DONE', logResult);
    } catch (logError) {
      console.error('GHI LOG CATEGORY UPDATE ERROR', logError);
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Lấy thông tin cũ
    const oldCategory = await prisma.category.findUnique({ where: { id } });
    // Debug trước khi xoá
    console.log('GHI LOG CATEGORY DELETE', { userId: session.user.id, id, oldCategory });
    await prisma.category.delete({ where: { id } });
    try {
      const logResult = await prisma.log.create({
        data: {
          adminId: session?.user?.id || null,
          userEmail: session?.user?.email || null,
          level: 'INFO',
          message: `Xoá danh mục: ${oldCategory?.name || ''}`,
          action: 'DELETE',
          entity: 'category',
          entityId: id,
          details: JSON.stringify({ name: oldCategory?.name || '', changes: { before: oldCategory }, adminEmail: session?.user?.email || null }),
        },
      });
      console.log('GHI LOG CATEGORY DELETE DONE', logResult);
    } catch (logError) {
      console.error('GHI LOG CATEGORY DELETE ERROR', logError);
    }

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 