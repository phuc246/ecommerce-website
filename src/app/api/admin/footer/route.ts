import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface FooterColumn {
  title: string;
  links: {
    text: string;
    url: string;
  }[];
}

export interface FooterData {
  columns: FooterColumn[];
}

export async function GET() {
  try {
    const footer = await prisma.setting.findFirst({
      where: {
        key: "footer",
      },
    });

    if (!footer) {
      // Return default structure if no footer exists
      const defaultFooter: FooterData = {
        columns: Array(5).fill(null).map((_, i) => ({
          title: `Column ${i + 1}`,
          links: []
        }))
      };
      return NextResponse.json({ value: JSON.stringify(defaultFooter) });
    }

    return NextResponse.json(footer);
  } catch (error) {
    console.error("Error fetching footer:", error);
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
        { error: "Footer content is required" },
        { status: 400 }
      );
    }

    const footer = await prisma.setting.upsert({
      where: {
        key: "footer",
      },
      update: {
        value: content,
      },
      create: {
        key: "footer",
        value: content,
      },
    });

    return NextResponse.json(footer);
  } catch (error) {
    console.error("Error updating footer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 