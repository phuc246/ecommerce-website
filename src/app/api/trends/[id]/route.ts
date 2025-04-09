import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    return NextResponse.json(trend);
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