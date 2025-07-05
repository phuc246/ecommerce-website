import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Default logo as SVG data URL
const DEFAULT_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNmZjc2YWQiLz4KICA8cGF0aCBkPSJNMzAgNzBMNTAgMzBMNzAgNzBIMzBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K";

export async function GET() {
  try {
    // Clear prisma cache to ensure fresh data
    await prisma.$disconnect();
    
    const logo = await prisma.setting.findFirst({
      where: {
        key: "logo"
      }
    });

    // Get logo type info (circular or not)
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

    // Validate the logo value
    let logoUrl = DEFAULT_LOGO;
    let isDefault = true;
    
    if (logo && logo.value && logo.value.trim() !== '') {
      // Check if the logo value is a valid data URL or path
      if (logo.value.startsWith('data:image/')) {
        logoUrl = logo.value;
        isDefault = false;
      } else if (logo.value.startsWith('/') || logo.value.startsWith('http')) {
        // For URL paths, we'll add cache-busting
        logoUrl = logo.value;
        isDefault = false;
      } else {
        console.warn("Invalid logo value format:", logo.value.substring(0, 30) + "...");
      }
    }

    // If no valid logo in database, return default
    if (isDefault) {
      return NextResponse.json({
        url: DEFAULT_LOGO,
        isDefault: true,
        isCircular
      }, { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    interface LogoResponse {
      url: string;
      isDefault: boolean;
      isCircular: boolean;
      timestamp?: number;
    }

    const responseData: LogoResponse = {
      url: logoUrl,
      isDefault: false,
      isCircular
    };

    // Only add timestamp if not a data URL
    if (!logoUrl.startsWith('data:image/')) {
      responseData.timestamp = Date.now();
    }

    return NextResponse.json(responseData, { 
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Error fetching logo:", error);
    return NextResponse.json({
      url: DEFAULT_LOGO,
      isDefault: true,
      isCircular: true
    }, { 
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { imageUrl, isCircular } = body;

    // Case 1: Updating both image and shape
    if (imageUrl) {
      if (typeof imageUrl !== 'string') {
        return NextResponse.json({ error: 'Thiếu hoặc sai định dạng imageUrl' }, { status: 400 });
      }
      // Save logo image
      await prisma.setting.upsert({
        where: { key: 'logo' },
        update: { value: imageUrl },
        create: { key: 'logo', value: imageUrl },
      });
    }

    // Case 2: Updating the shape (isCircular)
    if (typeof isCircular === 'boolean') {
      const currentLogoType = await prisma.setting.findUnique({ where: { key: 'logoType' } });
      const currentSettings = currentLogoType ? JSON.parse(currentLogoType.value || '{}') : {};
      
      await prisma.setting.upsert({
        where: { key: 'logoType' },
        update: { value: JSON.stringify({ ...currentSettings, isCircular }) },
        create: { key: 'logoType', value: JSON.stringify({ isCircular }) },
      });
    }

    // Ghi log thao tác cập nhật logo
    await prisma.log.create({
      data: {
        ...(session?.user?.id ? { admin: { connect: { id: session.user.id } } } : {}),
        level: 'INFO',
        message: imageUrl ? 'Cập nhật logo' : 'Thay đổi hình dạng logo',
        action: imageUrl ? 'UPDATE' : 'SHAPE',
        entity: 'logo',
        entityId: 'logo',
        details: imageUrl
          ? 'Người dùng đã cập nhật logo mới'
          : `Thay đổi hình dạng logo thành ${isCircular ? 'tròn' : 'vuông'}`,
      },
    });

    // Lấy lại URL logo hiện tại để trả về
    const updatedLogo = await prisma.setting.findFirst({ where: { key: 'logo' } });

    return NextResponse.json({ 
      success: true,
      url: updatedLogo?.value || imageUrl, // Trả về logo mới hoặc logo hiện tại
      isDefault: false,
      isCircular: isCircular
    });
  } catch (error) {
    console.error('Error updating logo:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật logo', details: String(error) }, { status: 500 });
  }
} 