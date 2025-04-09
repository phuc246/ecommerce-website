import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Sử dụng $queryRaw để tránh lỗi với property 'setting'
    const logoResult = await prisma.$queryRaw`SELECT * FROM "Setting" WHERE key = 'logo' LIMIT 1`;
    const logoSettings = Array.isArray(logoResult) && logoResult.length > 0 ? logoResult[0] : null;
    
    // Lấy cài đặt cho kiểu logo (hình tròn hay không)
    const logoTypeResult = await prisma.$queryRaw`SELECT * FROM "Setting" WHERE key = 'logoType' LIMIT 1`;
    const logoTypeSettings = Array.isArray(logoTypeResult) && logoTypeResult.length > 0 ? logoTypeResult[0] : null;
    
    let isCircular = true; // Mặc định là hình tròn
    if (logoTypeSettings && logoTypeSettings.value) {
      try {
        const logoType = JSON.parse(logoTypeSettings.value);
        isCircular = logoType.isCircular !== undefined ? logoType.isCircular : true;
      } catch (e) {
        console.error("Error parsing logoType:", e);
      }
    }

    return NextResponse.json({
      key: "logo",
      value: logoSettings?.value || "",
      isCircular
    });
  } catch (error) {
    console.error("Error fetching logo:", error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  let session;
  try {
    session = await getServerSession(authOptions);
    
    // Log session details to help debug
    console.log("Current session:", JSON.stringify(session));
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    if (!session.user || session.user.role !== "ADMIN") {
      console.log("User role:", session.user?.role);
      return NextResponse.json({ error: "Not authorized - Admin role required" }, { status: 403 });
    }

    const data = await request.json();
    const { imageUrl, isCircular = true } = data;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Lưu URL logo
    await prisma.$executeRaw`
      INSERT INTO "Setting" (key, value, "createdAt", "updatedAt")
      VALUES ('logo', ${imageUrl}, NOW(), NOW())
      ON CONFLICT (key) 
      DO UPDATE SET value = ${imageUrl}, "updatedAt" = NOW();
    `;
    
    // Lưu thông tin kiểu logo (hình tròn hay không)
    const logoTypeValue = JSON.stringify({ isCircular });
    await prisma.$executeRaw`
      INSERT INTO "Setting" (key, value, "createdAt", "updatedAt")
      VALUES ('logoType', ${logoTypeValue}, NOW(), NOW())
      ON CONFLICT (key) 
      DO UPDATE SET value = ${logoTypeValue}, "updatedAt" = NOW();
    `;

    return NextResponse.json({ 
      key: "logo", 
      value: imageUrl,
      isCircular
    });
  } catch (error) {
    console.error("Error updating logo:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 