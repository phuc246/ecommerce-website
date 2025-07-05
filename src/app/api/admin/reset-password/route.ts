import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// This is a protected route that should only be accessible in development
// or with a secret key in production
export async function POST(request: NextRequest) {
  try {
    // Check if environment is development
    if (process.env.NODE_ENV !== "development") {
      const apiKey = request.headers.get("x-api-key");
      if (apiKey !== process.env.ADMIN_RESET_KEY) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // Receive new password from request or use default
    const data = await request.json().catch(() => ({}));
    const newPassword = data.password || "123456";

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Find admin user and update password
    const admin = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Update admin password
    const updatedAdmin = await prisma.user.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: "Admin password reset successfully",
      user: updatedAdmin,
      defaultPassword: newPassword === "123456",
    });
  } catch (error) {
    console.error("Error resetting admin password:", error);
    return NextResponse.json(
      { error: "Failed to reset admin password" },
      { status: 500 }
    );
  }
} 