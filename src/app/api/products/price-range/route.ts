import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Find min and max prices from all products
    const minPrice = await prisma.productVariant.aggregate({
      _min: { price: true },
    });
    const maxPrice = await prisma.productVariant.aggregate({
      _max: { price: true },
    });

    // Default values in case there are no products
    const min = minPrice._min.price || 0;
    const max = maxPrice._max.price || 10000000;

    return NextResponse.json({
      min,
      max,
    });
  } catch (error) {
    console.error("Error fetching price range:", error);
    return NextResponse.json(
      { error: "Internal server error", min: 0, max: 10000000 },
      { status: 500 }
    );
  }
} 