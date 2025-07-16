'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<{[code: string]: boolean}>({});
  const [imageError, setImageError] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  
  // Default image as base64 to avoid external requests
  const defaultImageBase64 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmZmU0ZjAiLz4KICA8cmVjdCB4PSI0MDAiIHk9IjEwMCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmZjc2YWQiLz4KICA8dGV4dCB4PSIzMDAiIHk9IjI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4IiBmaWxsPSIjNjY2NjY2Ij5LaMO0bmcgdGjhu4MgdOG6o2kgaMOsbmg8L3RleHQ+Cjwvc3ZnPgo=";

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch('/api/promotions/active');
        if (!response.ok) {
          console.error('[PromotionBanner] Fetch failed:', response.status, response.statusText);
          throw new Error('Failed to fetch promotions');
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setPromotions(data.map((promo: any) => ({
            id: promo.id,
            title: promo.title || '',
            description: promo.description || '',
            code: promo.code,
            discount: promo.discountValue ? (promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : `${promo.discountValue.toLocaleString('vi-VN')} VND`) : '',
            expiryDate: promo.endDate || '',
            backgroundImage: promo.backgroundImage || '',
          })));
        } else {
          setPromotions([]);
        }
      } catch (error) {
        console.error('[PromotionBanner] Error:', error);
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (!promotions || promotions.length === 0) return;
    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(promotions[0].expiryDate);
      const diff = expiry.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('Đã hết hạn');
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${days} ngày ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [promotions]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(prev => ({ ...prev, [code]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [code]: false })), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <div className="h-24 bg-gray-300 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!promotions || promotions.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto my-3">
        <div className="mb-6 text-3xl font-bold text-pink-500 drop-shadow-lg text-center">Voucher</div>
        <div className="flex justify-center items-center h-32">
          <span className="text-lg text-gray-500">Chưa có chương trình khuyến mãi mới</span>
        </div>
      </div>
    );
  }

  // Carousel scroll container
  const isScroll = promotions.length > 4;
  const isFull = promotions.length === 4;
  const isCenter = promotions.length < 4;
  return (
    <div className="w-full py-4 bg-pink-50 px-2 md:px-4 mx-auto">
      <motion.div
        className="mb-4 text-3xl font-bold text-pink-500 drop-shadow-lg text-center w-full mx-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
      >
        Voucher
      </motion.div>
      <div
        className={
          `flex gap-6 snap-x snap-mandatory md:px-2 w-full overflow-x-auto justify-start`
        }
      >
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className={
              `flex-shrink-0 snap-center h-[90px] md:h-[140px] rounded-lg overflow-hidden relative shadow-lg bg-white/80 min-w-[80vw] sm:min-w-[250px] ` +
              (isCenter
                ? (promotions.length === 1
                    ? 'w-full max-w-2xl'
                    : promotions.length === 2
                      ? 'w-1/2 max-w-xl'
                      : 'w-1/3 max-w-lg')
                : 'w-1/4 min-w-[250px] max-w-[420px]') +
              ' sm:w-1/2 sm:max-w-xs w-[90vw] min-w-[260px] max-w-[95vw]'
            }
          >
            <div className="absolute inset-0 w-full h-full z-0">
              {(() => {
                const bg = promo.backgroundImage;
                const isVideo = typeof bg === 'string' && bg.toLowerCase().endsWith('.mp4');
                if (bg) {
                  if (isVideo) {
                    return <video src={bg} className="w-full h-full object-cover" autoPlay loop muted playsInline />;
                  } else {
                    return <img src={bg} alt="Banner background" className="w-full h-full object-cover" loading={promo.id === promotions[0].id ? "eager" : "lazy"} width="420" height="200" />;
                  }
                } else {
                  return <div className="w-full h-full bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 opacity-80" />;
                }
              })()}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
            </div>
            <div className="relative z-10 flex flex-col justify-center w-full h-full p-4 text-white">
              <h3 className="font-bold text-base md:text-2xl mb-1 flex items-center gap-2">
                {promo.title}
                <motion.span
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  className="inline-block text-yellow-300"
                >
                  <Sparkles size={20} />
                </motion.span>
              </h3>
              <p className="text-xs md:text-sm mb-1 line-clamp-2 md:line-clamp-3">{promo.description}</p>
              <div className="flex flex-row items-center gap-2 mb-1 flex-wrap">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: [0, 2, -2, 0] }}
                  className="bg-pink-100 text-indigo-900 font-mono font-bold py-1 px-3 rounded-lg flex items-center cursor-pointer border-2 border-yellow-300 text-xs md:text-base"
                  onClick={() => copyToClipboard(promo.code)}
                  aria-label="Sao chép mã khuyến mãi"
                  style={{ wordBreak: 'break-all', fontSize: 'clamp(13px,3vw,18px)' }}
                >
                  <Sparkles className="mr-1 text-yellow-400 animate-pulse" size={16} />
                  <span className="mr-1">{promo.code}</span>
                  {copied[promo.code] ? (
                    <span className="text-green-600 text-xs">Đã sao chép!</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </motion.div>
                {/* Hiển thị loại giảm giá */}
                <div className="text-xs font-semibold text-pink-700 mt-1 bg-white/80 rounded px-2 py-0.5 ml-2">
                  {promo.discount && promo.discount.includes('%')
                    ? `Giảm ${promo.discount}`
                    : promo.discount && !isNaN(Number(promo.discount.replace(/[^\d]/g, '')))
                      ? `Giảm ${Number(promo.discount.replace(/[^\d]/g, '')).toLocaleString()}đ`
                      : ''}
                </div>
                <span className="text-xs font-medium block w-full md:w-auto">
                  {promo.expiryDate ? `Còn lại: ${Math.floor((new Date(promo.expiryDate).getTime() - Date.now())/(1000*60*60*24))} ngày` : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 