import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trend = await prisma.trend.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!trend) {
      return NextResponse.json(
        { error: "Trend not found" },
        { status: 404 }
      );
    }

    const productTrends = await prisma.productTrend.findMany({
      where: { trendId: params.id },
      select: { productId: true }
    });

    return NextResponse.json({
      trend,
      productIds: productTrends.map(pt => pt.productId)
    });
  } catch (error) {
    console.error("Error fetching trend:", error);
    return NextResponse.json(
      { error: "Failed to fetch trend" },
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

    const { name, image, productCount } = await request.json();

    // Validate required fields
    if (!name || !image) {
      return NextResponse.json(
        { error: "Name and image are required" },
        { status: 400 }
      );
    }

    // Check if trend exists
    const existingTrend = await prisma.trend.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingTrend) {
      return NextResponse.json(
        { error: "Trend not found" },
        { status: 404 }
      );
    }

    // Update trend
    const updatedTrend = await prisma.trend.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        image,
        productCount: productCount || 0,
      },
    });

    // Ghi log update trend
    const admin = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
    await prisma.log.create({
      data: {
        adminId: admin ? admin.id : null,
        userEmail: admin ? admin.email : null,
        action: 'UPDATE',
        entity: 'trend',
        entityId: updatedTrend.id,
        details: JSON.stringify({ name: updatedTrend.name, changes: { before: { name: existingTrend?.name }, after: { name: updatedTrend.name } }, adminEmail: admin ? admin.email : null }),
        level: 'INFO',
        message: 'UPDATE trend',
      },
    });

    return NextResponse.json(updatedTrend);
  } catch (error) {
    console.error("Error updating trend:", error);
    return NextResponse.json(
      { error: "Failed to update trend" },
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

    // Check if trend exists
    const existingTrend = await prisma.trend.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingTrend) {
      return NextResponse.json(
        { error: "Trend not found" },
        { status: 404 }
      );
    }

    // Delete trend
    await prisma.trend.delete({
      where: {
        id: params.id,
      },
    });

    // Ghi log delete trend
    const adminDel = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
    await prisma.log.create({
      data: {
        adminId: adminDel ? adminDel.id : null,
        userEmail: adminDel ? adminDel.email : null,
        action: 'DELETE',
        entity: 'trend',
        entityId: params.id,
        details: JSON.stringify({ name: existingTrend?.name, changes: { before: { name: existingTrend?.name } }, adminEmail: adminDel ? adminDel.email : null }),
        level: 'INFO',
        message: 'DELETE trend',
      },
    });

    return NextResponse.json(
      { message: "Trend deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting trend:", error);
    return NextResponse.json(
      { error: "Failed to delete trend" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request, { params }) {
  try {
    const trendId = params.id;
    const { productIds } = await request.json();
    if (!Array.isArray(productIds) || !trendId) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    // Xoá các liên kết cũ (nếu muốn chỉ giữ các sản phẩm mới)
    await prisma.productTrend.deleteMany({ where: { trendId } });
    // Tạo mới các liên kết
    await prisma.productTrend.createMany({
      data: productIds.map(productId => ({ productId, trendId })),
      skipDuplicates: true
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding products to trend:', error);
    return NextResponse.json({ error: 'Failed to add products to trend' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 