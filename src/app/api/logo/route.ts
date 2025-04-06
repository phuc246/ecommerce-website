import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const logo = await prisma.logo.findFirst();
    return NextResponse.json(logo || { url: "/images/logo.png" });
  } catch (error) {
    console.error("Lỗi khi lấy logo:", error);
    return NextResponse.json(
      { error: "Không thể lấy thông tin logo" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Không có quyền truy cập" },
      { status: 401 }
    );
  }

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL logo không được để trống" },
        { status: 400 }
      );
    }

    // Kiểm tra xem đã có logo chưa
    const existingLogo = await prisma.logo.findFirst();

    if (existingLogo) {
      // Nếu đã có logo, cập nhật
      const logo = await prisma.logo.update({
        where: { id: existingLogo.id },
        data: { url },
      });
      return NextResponse.json(logo);
    } else {
      // Nếu chưa có logo, tạo mới
      const logo = await prisma.logo.create({
        data: { url },
      });
      return NextResponse.json(logo);
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật logo:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật logo. Vui lòng thử lại." },
      { status: 500 }
    );
  }
} 