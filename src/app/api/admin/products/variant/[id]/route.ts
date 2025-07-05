import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// Lấy thông tin 1 biến thể sản phẩm
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: params.id },
    });
    if (!variant) {
      return NextResponse.json({ error: "Không tìm thấy biến thể" }, { status: 404 });
    }
    return NextResponse.json(variant);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// Cập nhật 1 biến thể sản phẩm
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const updated = await prisma.productVariant.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// Xóa 1 biến thể sản phẩm
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await prisma.productVariant.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
} 