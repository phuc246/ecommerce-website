import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attributes = await prisma.attribute.findMany({
      include: {
        _count: {
          select: { productAttributes: true },
        },
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(attributes);
  } catch (error) {
    console.error("Error fetching attributes:", error);
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
    const { name } = data;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const attribute = await prisma.attribute.create({
      data: {
        name,
      },
    });

    // Kiểm tra adminId và lấy email
    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });

    // Ghi log thao tác
    await prisma.log.create({
      data: {
        adminId: admin ? admin.id : null,
        userEmail: admin ? admin.email : null,
        action: 'CREATE',
        entity: 'attribute',
        entityId: attribute.id,
        details: JSON.stringify({ name: attribute.name, changes: { after: { name: attribute.name } }, adminEmail: admin ? admin.email : null }),
        level: 'INFO',
        message: 'CREATE attribute',
      },
    });

    return NextResponse.json(attribute);
  } catch (error) {
    console.error("Error creating attribute:", error);
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

    // Lấy dữ liệu cũ để log
    const oldAttribute = await prisma.attribute.findUnique({ where: { id } });

    const attribute = await prisma.attribute.update({
      where: { id },
      data: {
        name,
      },
    });

    // Kiểm tra adminId và lấy email
    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });

    // Ghi log thao tác sửa
    await prisma.log.create({
      data: {
        adminId: admin ? admin.id : null,
        userEmail: admin ? admin.email : null,
        action: 'UPDATE',
        entity: 'attribute',
        entityId: attribute.id,
        details: JSON.stringify({ name: attribute.name, changes: { before: { name: oldAttribute?.name }, after: { name: attribute.name } }, adminEmail: admin ? admin.email : null }),
        level: 'INFO',
        message: 'UPDATE attribute',
      },
    });

    return NextResponse.json(attribute);
  } catch (error) {
    console.error("Error updating attribute:", error);
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
        { error: "Attribute ID is required" },
        { status: 400 }
      );
    }

    // Lấy dữ liệu cũ để log
    const oldAttribute = await prisma.attribute.findUnique({ where: { id } });

    // Xoá tất cả liên kết ProductAttribute trước khi xoá attribute
    await prisma.productAttribute.deleteMany({ where: { attributeId: id } });
    await prisma.attribute.delete({ where: { id } });

    // Kiểm tra adminId và lấy email
    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });

    // Ghi log thao tác xoá
    await prisma.log.create({
      data: {
        adminId: admin ? admin.id : null,
        userEmail: admin ? admin.email : null,
        action: 'DELETE',
        entity: 'attribute',
        entityId: id,
        details: JSON.stringify({ name: oldAttribute?.name, changes: { before: { name: oldAttribute?.name } }, adminEmail: admin ? admin.email : null }),
        level: 'INFO',
        message: 'DELETE attribute',
      },
    });

    return NextResponse.json({ message: "Attribute deleted successfully" });
  } catch (error) {
    console.error("Error deleting attribute:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 