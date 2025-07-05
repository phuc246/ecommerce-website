import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        productAttributes: {
          include: { attribute: true }
        },
      },
    });

    // Chuẩn hóa dữ liệu trả về
    const result = products.map(product => ({
      ...product,
      attributes: product.productAttributes.map(pa => pa.attribute),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    if (!name || !image || !categoryId || !variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: "Missing required fields or invalid variants" }, { status: 400 });
    }
    
    // Basic validation for each variant (new logic)
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

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "Đang cập nhật",
        image,
        images: images || [],
        category: { connect: { id: categoryId } },
        variants: {
          create: variants.flatMap((variant: any) =>
            variant.sizes.map((sz: any) => ({
              color: variant.color,
              colorHex: variant.colorHex,
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

    // Ghi log thao tác
    await prisma.log.create({
      data: {
        adminId: session.user.id,
        level: 'info',
        action: 'CREATE',
        entity: 'product',
        entityId: product.id,
        message: `Admin ${session.user.email} (${session.user.role}) đã tạo sản phẩm mới`,
        details: product,
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
    // Xóa hết variants, attributes, trends cũ
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.productAttribute.deleteMany({ where: { productId: id } });
    await prisma.productTrend.deleteMany({ where: { productId: id } });
    // Cập nhật sản phẩm
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || "Đang cập nhật",
        image,
        images: images || [],
        category: { connect: { id: categoryId } },
        variants: {
          create: variants.flatMap((variant: any) =>
            variant.sizes.map((sz: any) => ({
              color: variant.color,
              colorHex: variant.colorHex,
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
    // Ghi log thao tác
    await prisma.log.create({
      data: {
        adminId: session.user.id,
        level: 'info',
        action: 'UPDATE',
        entity: 'product',
        entityId: updated.id,
        message: `Admin ${session.user.email} (${session.user.role}) đã cập nhật sản phẩm`,
        details: updated,
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

    // Transaction to delete a product and its variants
    await prisma.$transaction(async (tx) => {
      // Delete variants first
      await tx.productVariant.deleteMany({
        where: { productId: id }
      });
      
      // Then delete ProductAttribute and ProductTrend connections
      await tx.productAttribute.deleteMany({
          where: { productId: id }
      });
      await tx.productTrend.deleteMany({
          where: { productId: id }
      });

      // Finally, delete the product itself
      await tx.product.delete({
        where: { id }
      });
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