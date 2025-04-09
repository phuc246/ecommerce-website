'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: string;
  expiryDate: string;
  backgroundImage: string;
}

export default function PromotionBanner() {
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Default image as base64 to avoid external requests
  const defaultImageBase64 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmZmU0ZjAiLz4KICA8cmVjdCB4PSI0MDAiIHk9IjEwMCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmZjc2YWQiLz4KICA8dGV4dCB4PSIzMDAiIHk9IjI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4IiBmaWxsPSIjNjY2NjY2Ij5LaMO0bmcgdGjhu4MgdOG6o2kgaMOsbmg8L3RleHQ+Cjwvc3ZnPgo=";

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch('/api/promotions/active');
        if (!response.ok) {
          throw new Error('Failed to fetch promotions');
        }
        const data = await response.json();
        setCurrentPromotion(Array.isArray(data) && data.length > 0 ? data[0] : null);
      } catch (error) {
        console.error('Error fetching promotions:', error);
        // Fallback data if API fails
        setCurrentPromotion({
          id: '1',
          title: 'Khuyến Mãi Đặc Biệt',
          description: 'Giảm giá 20% cho tất cả sản phẩm thời trang mùa hè khi nhập mã',
          code: 'SUMMER20',
          discount: '20%',
          expiryDate: '2023-12-31',
          backgroundImage: '/images/promotions/summer-sale.jpg'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <div className="h-64 bg-gray-300 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!currentPromotion) {
    return null;
  }

  const expiryDate = new Date(currentPromotion.expiryDate);
  const formattedDate = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(expiryDate);

  return (
    <div className="container mx-auto px-4">
      <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden">
        <Image
          src={imageError ? defaultImageBase64 : currentPromotion.backgroundImage}
          alt={currentPromotion.title}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized={imageError}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-transparent flex items-center">
          <div className="p-8 md:p-12 lg:p-16 max-w-lg text-white">
            <h3 className="font-bold text-3xl md:text-4xl mb-4">{currentPromotion.title}</h3>
            <p className="text-lg mb-6">{currentPromotion.description}</p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div 
                className="bg-white text-indigo-900 font-mono font-bold py-2 px-4 rounded-lg flex items-center cursor-pointer"
                onClick={() => copyToClipboard(currentPromotion.code)}
              >
                <span className="mr-2">{currentPromotion.code}</span>
                {copied ? (
                  <span className="text-green-600 text-sm">Đã sao chép!</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <span className="text-sm">Hết hạn: {formattedDate}</span>
            </div>
            
            <Link 
              href="/products" 
              className="inline-block bg-white text-indigo-900 hover:bg-opacity-90 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Mua sắm ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 