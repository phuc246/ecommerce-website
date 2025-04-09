import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // In a real application, you would query promotions from a database table
    // For this example, we'll return a mock promotion
    const currentDate = new Date();
    
    // Mock promotions data (in a real app, this would come from database)
    const promotions = [
      {
        id: '1',
        title: 'Khuyến Mãi Đặc Biệt',
        description: 'Giảm giá 20% cho tất cả sản phẩm thời trang mùa hè khi nhập mã',
        code: 'SUMMER20',
        discount: '20%',
        expiryDate: '2023-12-31',
        backgroundImage: '/images/promotions/summer-sale.jpg'
      },
      {
        id: '2',
        title: 'Flash Sale',
        description: 'Giảm giá 30% cho các sản phẩm giày dép nổi bật',
        code: 'FLASH30',
        discount: '30%',
        expiryDate: '2023-08-31',
        backgroundImage: '/images/promotions/flash-sale.jpg'
      }
    ];
    
    // Filter for active promotions (not expired)
    const activePromotions = promotions.filter(promo => {
      const expiryDate = new Date(promo.expiryDate);
      return expiryDate > currentDate;
    });

    return NextResponse.json(activePromotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
} 