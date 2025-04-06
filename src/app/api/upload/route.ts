import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Không có quyền truy cập" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "Không có file được tải lên" },
        { status: 400 }
      );
    }

    // Kiểm tra và tạo thư mục uploads nếu chưa tồn tại
    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tạo tên file duy nhất
    const timestamp = Date.now();
    const filename = `logo-${timestamp}.${file.name.split(".").pop()}`;
    const path = join(uploadDir, filename);

    // Lưu file
    await writeFile(path, buffer);

    // Trả về đường dẫn file
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Lỗi khi tải lên file:", error);
    return NextResponse.json(
      { error: "Không thể tải lên file. Vui lòng thử lại." },
      { status: 500 }
    );
  }
} 