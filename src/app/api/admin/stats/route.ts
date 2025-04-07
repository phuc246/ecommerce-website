import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Fetch stats from database
    const [totalProducts, totalCategories] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
    ]);

    return NextResponse.json({
      totalProducts,
      totalCategories,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 