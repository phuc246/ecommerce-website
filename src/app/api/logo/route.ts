import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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