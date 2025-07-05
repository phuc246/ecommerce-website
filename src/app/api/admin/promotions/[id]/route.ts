import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/admin/promotions/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const promotion = await prisma.promotion.findUnique({ where: { id: params.id } });
    if (!promotion) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }
    return NextResponse.json(promotion);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch promotion" }, { status: 500 });
  }
}

// PUT /api/admin/promotions/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const existingPromotion = await prisma.promotion.findUnique({
      where: { id: params.id },
    });

    if (!existingPromotion) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }
    
    // Allow partial updates
    const dataToUpdate = Object.fromEntries(
      Object.entries(body).filter(([_, value]) => value !== undefined)
    );

    if (dataToUpdate.discountValue) dataToUpdate.discountValue = parseFloat(dataToUpdate.discountValue as string);
    if (dataToUpdate.usageLimit) dataToUpdate.usageLimit = parseInt(dataToUpdate.usageLimit as string, 10);
    if (dataToUpdate.startDate) dataToUpdate.startDate = new Date(dataToUpdate.startDate as string);
    if (dataToUpdate.endDate) dataToUpdate.endDate = new Date(dataToUpdate.endDate as string);

    // Ensure we are using backgroundImage
    if (dataToUpdate.image) {
      dataToUpdate.backgroundImage = dataToUpdate.image;
      delete dataToUpdate.image;
    }

    const updatedPromotion = await prisma.promotion.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    // Log the update action
    await prisma.log.create({
      data: {
        adminId: session.user.id,
        message: session.user.email,
        level: session.user.role,
        action: 'UPDATE',
        entity: 'promotion',
        entityId: updatedPromotion.id,
        details: JSON.stringify({ before: existingPromotion, after: updatedPromotion }),
      },
    });

    return NextResponse.json(updatedPromotion);
  } catch (error) {
    console.error("Failed to update promotion:", error);
    return NextResponse.json({ error: "Failed to update promotion", detail: String(error) }, { status: 500 });
  }
}

// DELETE /api/admin/promotions/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deletedPromotion = await prisma.promotion.delete({ where: { id: params.id } });
    
    // Log the delete action
    await prisma.log.create({
      data: {
        adminId: session.user.id,
        message: session.user.email,
        level: session.user.role,
        action: 'DELETE',
        entity: 'promotion',
        entityId: deletedPromotion.id,
        details: JSON.stringify(deletedPromotion),
      },
    });

    return NextResponse.json({ message: "Promotion deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
} 