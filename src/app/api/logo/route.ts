import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Khởi tạo Prisma Client mới cho API này
const prisma = new PrismaClient();

export async function GET() {
  try {
    // Lấy thông tin logo
    const result = await prisma.$queryRaw`SELECT * FROM "Setting" WHERE key = 'logo' LIMIT 1`;
    const logoSettings = Array.isArray(result) && result.length > 0 ? result[0] : null;
    
    // Lấy thông tin kiểu logo (hình tròn hay không)
    const logoTypeResult = await prisma.$queryRaw`SELECT * FROM "Setting" WHERE key = 'logoType' LIMIT 1`;
    const logoTypeSettings = Array.isArray(logoTypeResult) && logoTypeResult.length > 0 ? logoTypeResult[0] : null;
    
    // Xác định kiểu logo (mặc định là hình tròn)
    let isCircular = true;
    if (logoTypeSettings && logoTypeSettings.value) {
      try {
        const logoType = JSON.parse(logoTypeSettings.value);
        isCircular = logoType.isCircular !== undefined ? logoType.isCircular : true;
      } catch (e) {
        console.error("Error parsing logoType:", e);
      }
    }
    
    // Xử lý giá trị logo từ cơ sở dữ liệu
    if (!logoSettings || !logoSettings.value) {
      return NextResponse.json({ 
        url: "/images/logo.png",
        isDefault: true,
        isCircular
      });
    }

    // Xác nhận rằng URL logo hợp lệ
    let logoUrl = logoSettings.value;
    if (!logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
      logoUrl = "/images/logo.png";
    }

    return NextResponse.json({ 
      url: logoUrl,
      isDefault: logoUrl === "/images/logo.png",
      isCircular
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin logo:", error);
    // Trả về logo mặc định trong trường hợp lỗi
    return NextResponse.json(
      { 
        url: "/images/logo.png", 
        isDefault: true,
        isCircular: true,
        error: "Đã xảy ra lỗi khi tải logo"
      },
      { status: 200 }
    );
  } finally {
    // Đảm bảo đóng kết nối để tránh rò rỉ
    await prisma.$disconnect();
  }
} 