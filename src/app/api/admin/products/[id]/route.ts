import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        category: true,
        colors: true,
        sizes: true,
        attributes: {
          select: {
            id: true,
            name: true,
          },
        },
        trend: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { 
      name, 
      description, 
      price, 
      salePrice, 
      sku, 
      stock, 
      image, 
      images,
      categoryId, 
      colors, 
      sizes, 
      attributes,
      trendId 
    } = await request.json();

    // Validate required fields
    if (!name || !description || !price || !image || !stock || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if sale price is less than regular price
    if (salePrice && parseFloat(salePrice) >= parseFloat(price)) {
      return NextResponse.json(
        { error: "Sale price must be less than regular price" },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        colors: true,
        sizes: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Start transaction to ensure all related data is updated consistently
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Delete existing colors and sizes
      await tx.productColor.deleteMany({
        where: {
          productId: params.id,
        },
      });

      await tx.productSize.deleteMany({
        where: {
          productId: params.id,
        },
      });

      // Delete existing attribute associations
      await tx.productAttribute.deleteMany({
        where: {
          productId: params.id,
        },
      });

      // Update the product
      const updated = await tx.product.update({
        where: {
          id: params.id,
        },
        data: {
          name,
          description,
          price: parseFloat(price),
          salePrice: salePrice ? parseFloat(salePrice) : null,
          sku,
          stock: parseInt(stock),
          image,
          images: images || [],
          categoryId,
          trendId: trendId || null,
          updatedAt: new Date(),
        },
      });

      // Add new colors
      for (const color of colors) {
        await tx.productColor.create({
          data: {
            productId: params.id,
            name: color.name,
            value: color.value,
            image: color.image,
          },
        });
      }

      // Add new sizes
      for (const size of sizes) {
        await tx.productSize.create({
          data: {
            productId: params.id,
            name: size.name,
          },
        });
      }

      // Add new attribute associations
      if (attributes && attributes.length > 0) {
        for (const attributeId of attributes) {
          await tx.productAttribute.create({
            data: {
              productId: params.id,
              attributeId,
            },
          });
        }
      }

      return updated;
    });

    // Revalidate product pages
    revalidatePath(`/products/${updatedProduct.id}`);
    revalidatePath('/products');

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete product and related records in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Delete colors associated with the product
      await tx.productColor.deleteMany({
        where: {
          productId: params.id,
        },
      });

      // Delete sizes associated with the product
      await tx.productSize.deleteMany({
        where: {
          productId: params.id,
        },
      });

      // Delete attribute associations
      await tx.productAttribute.deleteMany({
        where: {
          productId: params.id,
        },
      });

      // Delete cart items with this product
      await tx.cartItem.deleteMany({
        where: {
          productId: params.id,
        },
      });

      // Delete the product itself
      await tx.product.delete({
        where: {
          id: params.id,
        },
      });
    });

    // Revalidate products page
    revalidatePath('/products');

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 