import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          variants: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
        name, description, image, images, categoryId, 
        trendId, attributeIds, variants 
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "Tên sản phẩm không được để trống" }, { status: 400 });
    }
    
    if (!image || typeof image !== 'string' || image.trim().length === 0) {
      return NextResponse.json({ error: "Ảnh sản phẩm không được để trống" }, { status: 400 });
    }
    
    if (!categoryId || typeof categoryId !== 'string' || categoryId.trim().length === 0) {
      return NextResponse.json({ error: "Danh mục sản phẩm không được để trống" }, { status: 400 });
    }
    
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: "Sản phẩm phải có ít nhất một biến thể" }, { status: 400 });
    }
    
    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      return NextResponse.json({ error: "Danh mục không tồn tại" }, { status: 400 });
    }
    
    // Validate each variant
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      
      if (!variant.color || typeof variant.color !== 'string' || variant.color.trim().length === 0) {
        return NextResponse.json({ error: `Biến thể ${i + 1}: Tên màu không được để trống` }, { status: 400 });
      }
      
      if (variant.price == null || isNaN(parseFloat(variant.price)) || parseFloat(variant.price) < 0) {
        return NextResponse.json({ error: `Biến thể ${i + 1}: Giá phải là số dương` }, { status: 400 });
      }
      
      if (!Array.isArray(variant.sizes) || variant.sizes.length === 0) {
        return NextResponse.json({ error: `Biến thể ${i + 1}: Phải có ít nhất một kích thước` }, { status: 400 });
      }
      
      // Validate each size
      for (let j = 0; j < variant.sizes.length; j++) {
        const sz = variant.sizes[j];
        
        if (!sz.size || typeof sz.size !== 'string' || sz.size.trim().length === 0) {
          return NextResponse.json({ error: `Biến thể ${i + 1}, Kích thước ${j + 1}: Tên size không được để trống` }, { status: 400 });
        }
        
        if (sz.stock == null || isNaN(parseInt(sz.stock)) || parseInt(sz.stock) < 0) {
          return NextResponse.json({ error: `Biến thể ${i + 1}, Kích thước ${j + 1}: Số lượng phải là số >= 0` }, { status: 400 });
        }
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "Đang cập nhật",
        image,
        images: images && images.length > 0 ? { create: images } : undefined,
        category: { connect: { id: categoryId } },
        variants: {
          create: variants.flatMap((variant: any) =>
            variant.sizes.map((sz: any) => ({
              color: variant.color,
              size: sz.size,
              price: parseFloat(variant.price),
              salePrice: variant.salePrice ? parseFloat(variant.salePrice) : null,
              stock: parseInt(sz.stock, 10),
              sku: variant.sku || null,
              image: variant.image || null,
            }))
          ),
        },
        productAttributes: {
          create: attributeIds?.map((attrId: string) => ({
            attribute: { connect: { id: attrId } },
          })) || [],
        },
        productTrends: trendId ? {
          create: {
            trend: { connect: { id: trendId } },
          },
        } : undefined,
      },
    });

    // Ghi log thao tác (details chuẩn hóa)
    await prisma.log.create({
      data: {
        adminId: session.user.id,
        userEmail: session.user.email,
        level: 'info',
        action: 'CREATE',
        entity: 'product',
        entityId: product.id,
        message: `Admin ${session.user.email} (${session.user.role}) đã tạo sản phẩm mới`,
        details: { after: { name: product.name } },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error adding product:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors if necessary
        return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { id, name, description, image, images, categoryId, trendId, attributeIds, variants } = body;
    if (!id || !name || !image || !categoryId || !variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: "Missing required fields or invalid variants" }, { status: 400 });
    }
    // Validate variants
    for (const variant of variants) {
      if (variant.price == null || !Array.isArray(variant.sizes) || variant.sizes.length === 0) {
        return NextResponse.json({ error: `Biến thể không hợp lệ: Thiếu giá hoặc chưa có kích thước.` }, { status: 400 });
      }
      for (const sz of variant.sizes) {
        if (!sz.size || sz.stock == null || isNaN(sz.stock) || sz.stock < 0) {
          return NextResponse.json({ error: `Biến thể không hợp lệ: Kích thước hoặc số lượng không hợp lệ.` }, { status: 400 });
        }
      }
    }
    // Lấy trạng thái trước khi sửa
    const oldProduct = await prisma.product.findUnique({ where: { id } });
    // Xóa hết variants, attributes, trends cũ
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.productAttribute.deleteMany({ where: { productId: id } });
    await prisma.productTrend.deleteMany({ where: { productId: id } });
    // Xóa hết ảnh cũ trước khi thêm mới
    await prisma.productImage.deleteMany({ where: { productId: id } });
    // Cập nhật sản phẩm
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || "Đang cập nhật",
        image,
        images: images && images.length > 0 ? { create: images } : undefined,
        category: { connect: { id: categoryId } },
        variants: {
          create: variants.flatMap((variant: any) =>
            variant.sizes.map((sz: any) => ({
              color: variant.color,
              size: sz.size,
              price: parseFloat(variant.price),
              salePrice: variant.salePrice ? parseFloat(variant.salePrice) : null,
              stock: parseInt(sz.stock, 10),
              sku: variant.sku || null,
              image: variant.image || null,
            }))
          ),
        },
        productAttributes: {
          create: attributeIds?.map((attrId: string) => ({
            attribute: { connect: { id: attrId } },
          })) || [],
        },
        productTrends: trendId ? {
          create: {
            trend: { connect: { id: trendId } },
          },
        } : undefined,
      },
      include: { variants: true, category: true }
    });
    // Ghi log thao tác (details chuẩn hóa)
    await prisma.log.create({
      data: {
        adminId: session.user.id,
        userEmail: session.user.email,
        level: 'info',
        action: 'UPDATE',
        entity: 'product',
        entityId: updated.id,
        message: `Admin ${session.user.email} (${session.user.role}) đã cập nhật sản phẩm`,
        details: { before: { name: oldProduct?.name || '' }, after: { name: updated.name } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing product ID" },
        { status: 400 }
      );
    }

    // Lấy thông tin sản phẩm trước khi xóa
    const product = await prisma.product.findUnique({ where: { id } });

    await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productAttribute.deleteMany({ where: { productId: id } });
      await tx.productTrend.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
      });

    // Ghi log thao tác xóa (details chuẩn hóa)
    await prisma.log.create({
      data: {
        adminId: session.user.id,
        userEmail: session.user.email,
        level: 'info',
        action: 'DELETE',
        entity: 'product',
        entityId: id,
        message: `Admin ${session.user.email} (${session.user.role}) đã xóa sản phẩm`,
        details: { before: { name: product?.name || '' } },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}