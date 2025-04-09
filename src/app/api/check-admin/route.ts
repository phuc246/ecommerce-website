import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // Look for the admin user
    const admin = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true, // Include hashed password to check it
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    // Don't return the actual password hash, just check if it exists
    const hasPassword = !!admin.password;
    
    // Test if default password "123456" works
    let defaultPasswordWorks = false;
    
    if (hasPassword && admin.password) {
      try {
        defaultPasswordWorks = await bcrypt.compare("123456", admin.password);
      } catch (error) {
        console.error("Password comparison error:", error);
      }
    }

    // Return admin account info without the actual password hash
    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      hasPassword,
      defaultPasswordWorks,
      passwordLength: admin.password?.length || 0,
    });
  } catch (error) {
    console.error("Error checking admin account:", error);
    return NextResponse.json({ error: "Server error checking admin account" }, { status: 500 });
  }
} 