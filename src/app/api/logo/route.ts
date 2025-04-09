import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const logo = await prisma.setting.findFirst({
      where: {
        key: "logo"
      }
    });

    // Lấy thông tin kiểu logo (hình tròn hay không)
    const logoType = await prisma.setting.findFirst({
      where: {
        key: "logoType"
      }
    });

    let isCircular = true;
    if (logoType && logoType.value) {
      try {
        const settings = JSON.parse(logoType.value);
        isCircular = settings.isCircular !== undefined ? settings.isCircular : true;
      } catch (e) {
        console.error("Error parsing logoType:", e);
      }
    }

    // Nếu không có logo trong database hoặc URL không hợp lệ, trả về logo mặc định
    if (!logo || !logo.value) {
      return NextResponse.json({
        url: "/images/default-logo.png",
        isDefault: true,
        isCircular
      });
    }

    return NextResponse.json({
      url: logo.value,
      isDefault: false,
      isCircular
    });
  } catch (error) {
    console.error("Error fetching logo:", error);
    return NextResponse.json({
      url: "/images/default-logo.png",
      isDefault: true,
      isCircular: true
    });
  }
} 