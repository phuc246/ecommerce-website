import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { name, description, price, categoryId, stock, colors, sizes, attributes, image } = data;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image,
        categoryId,
        stock: parseInt(stock),
        colors: {
          create: colors.map((color: any) => ({
            name: color.name,
            value: color.value,
            image: color.image,
          })),
        },
        sizes: {
          create: sizes.map((size: any) => ({
            name: size.name,
            value: size.value,
          })),
        },
        attributes: {
          connect: attributes.map((attributeId: string) => ({
            id: attributeId,
          })),
        },
      },
      include: {
        category: true,
        colors: true,
        sizes: true,
        attributes: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
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
    const { id, name, description, price, categoryId, stock, colors, sizes, attributes, image } = data;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        image,
        categoryId,
        stock: parseInt(stock),
        colors: {
          deleteMany: {},
          create: colors.map((color: any) => ({
            name: color.name,
            value: color.value,
            image: color.image,
          })),
        },
        sizes: {
          deleteMany: {},
          create: sizes.map((size: any) => ({
            name: size.name,
            value: size.value,
          })),
        },
        attributes: {
          set: attributes.map((attributeId: string) => ({
            id: attributeId,
          })),
        },
      },
      include: {
        category: true,
        colors: true,
        sizes: true,
        attributes: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
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
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 