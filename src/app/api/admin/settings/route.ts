import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  try {
    const settings = await prisma.setting.findFirst({
      where: {
        key: "settings",
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
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
    const { content } = data;

    if (!content) {
      return NextResponse.json(
        { error: "Settings content is required" },
        { status: 400 }
      );
    }

    const settings = await prisma.setting.upsert({
      where: {
        key: "settings",
      },
      update: {
        value: content,
      },
      create: {
        key: "settings",
        value: content,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 