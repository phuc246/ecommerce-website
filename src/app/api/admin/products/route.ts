import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
        colors: true,
        sizes: true,
        attributes: true,
      },
    });

    return NextResponse.json(products);
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, price, image, colors, sizes, stock, categoryId, attributes } = body;

    // Validate required fields
    if (!name || !description || !price || !image || !colors || !sizes || !stock || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image,
        stock: parseInt(stock),
        categoryId,
        colors: {
          create: colors.map((color: any) => ({
            name: color.name,
            value: color.value,
            image: color.image || ""
          }))
        },
        sizes: {
          create: sizes.map((size: any) => ({
            name: size.name,
            value: size.name // Using name as value for consistency
          }))
        },
        attributes: {
          connect: attributes?.map((attributeId: string) => ({
            id: attributeId
          })) || []
        }
      },
      include: {
        category: true,
        colors: true,
        sizes: true,
        attributes: true
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error adding product:", error);
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, name, description, price, image, colors, sizes, stock, categoryId, attributes } = body;

    // Validate required fields
    if (!id || !name || !description || !price || !image || !colors || !sizes || !stock || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Update product with transaction to ensure data consistency
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Delete existing colors and sizes
      await tx.color.deleteMany({
        where: { productId: id }
      });

      await tx.size.deleteMany({
        where: { productId: id }
      });

      // Update product
      const product = await tx.product.update({
        where: { id },
        data: {
          name,
          description,
          price: parseFloat(price),
          image,
          stock: parseInt(stock),
          categoryId,
          colors: {
            create: colors.map((color: { name: string; value: string; image: string | null }) => ({
              name: color.name,
              value: color.value,
              image: color.image || ""
            }))
          },
          sizes: {
            create: sizes.map((size: { name: string }) => ({
              name: size.name,
              value: size.name
            }))
          },
          attributes: {
            set: attributes?.map((attributeId: string) => ({
              id: attributeId
            })) || []
          }
        },
        include: {
          category: true,
          colors: true,
          sizes: true,
          attributes: true
        }
      });

      return product;
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    // Delete product with transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.color.deleteMany({
        where: { productId: id }
      });

      await tx.size.deleteMany({
        where: { productId: id }
      });

      // Delete the product
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