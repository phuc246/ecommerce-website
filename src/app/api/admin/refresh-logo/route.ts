import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Revalidate paths that use the logo
    revalidatePath("/");
    revalidatePath("/api/logo");
    revalidatePath("/api/admin/logo");
    
    return NextResponse.json({
      success: true,
      message: "Logo cache cleared successfully",
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error refreshing logo cache:", error);
    return NextResponse.json(
      { error: "Failed to refresh logo cache", details: String(error) },
      { status: 500 }
    );
  }
} 