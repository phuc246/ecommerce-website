'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Base64-encoded transparent pixel
const defaultImageBase64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

interface TrendingCategory {
  id: string;
  name: string;
  image: string;
  productCount: number;
}

export default function TrendingSection() {
  const [trends, setTrends] = useState<TrendingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({});
  const [popupTrend, setPopupTrend] = useState<TrendingCategory | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/trends', { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error('Failed to fetch trends');
        }
        
        const data = await response.json();
        setTrends(data);
      } catch (error) {
        console.error('Error fetching trends:', error);
        setTrends([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  const handleImageError = (trendId: string) => {
    setImageFallbacks(prev => ({
      ...prev,
      [trendId]: true
    }));
  };

  if (loading) {
    // Bỏ hiệu ứng loading, luôn render nội dung chính
    // return (
    //   <div className="text-center py-12">
    //     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
    //   </div>
    // );
  }

  // Lọc trends hợp lệ trước khi render
  const validTrends = trends.filter(trend => trend && trend.id && trend.name && trend.image && typeof trend.productCount === 'number');

  // Thay layout flex cho trends
  const isScroll = validTrends.length > 4;
  const isCenter = validTrends.length < 4;

  return (
    <div className="py-12">
      <motion.h2
        className="text-4xl font-extrabold text-center mb-6 bg-gradient-to-r from-blue-300 via-cyan-500 to-green-600 bg-clip-text text-transparent drop-shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
      >
        Xu Hướng Thời Trang
      </motion.h2>
      <div className="relative w-full overflow-hidden">
        <div
          className={
            (isScroll
              ? 'flex flex-nowrap animate-marquee hover:pause'
              : 'flex flex-nowrap justify-center')
          }
        >
          {validTrends.map((trend, index) => (
            <div
              key={`${trend.id}-${index}`}
              className={
                'flex-shrink-0 mx-3 ' +
                (isScroll
                  ? 'w-[45vw] md:w-[23vw] lg:w-[22vw]'
                  : validTrends.length === 1
                    ? 'w-full max-w-2xl'
                    : validTrends.length === 2
                      ? 'w-1/2 max-w-xl'
                      : 'w-1/3 max-w-lg')
              }
            >
                <div className="relative overflow-hidden rounded-lg aspect-[3/4] w-full group">
                  <button type="button" className="w-full h-full absolute inset-0 z-10 focus:outline-none" onClick={() => setPopupTrend(trend)} aria-label={`Xem ảnh lớn trend ${trend.name}`}></button>
                  <Image
                    src={trend.image}
                    alt={trend.name}
                    fill
                    sizes="(max-width: 768px) 45vw, (max-width: 1024px) 23vw, 22vw"
                    className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 group-hover/card:bg-opacity-50 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 p-4 text-white z-20">
                    <h3 className="font-bold text-lg drop-shadow-lg">{trend.name}</h3>
                    <p className="text-sm drop-shadow-md">{trend.productCount} sản phẩm</p>
                    <a
                      href={`/trends#trend-${trend.id}`}
                      className="text-sm mt-2 inline-block font-semibold group-hover/card:underline drop-shadow-md cursor-pointer opacity-80"
                      style={{ pointerEvents: 'auto' }}
                      onClick={e => e.stopPropagation()}
                    >
                      Khám phá ngay &rarr;
                    </a>
                  </div>
                </div>
            </div>
          ))}
        </div>
      </div>
      {/* Popup trend image */}
      {popupTrend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setPopupTrend(null)}>
          <div className="bg-white rounded-lg shadow-xl p-4 max-w-[90vw] max-h-[90vh] flex flex-col items-center relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl font-bold" onClick={() => setPopupTrend(null)} aria-label="Đóng">×</button>
            <div className="relative w-[60vw] max-w-xs aspect-[3/4] rounded-lg overflow-hidden mb-4">
              <Image src={popupTrend.image} alt={popupTrend.name} fill className="object-cover" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">{popupTrend.name}</h2>
          </div>
        </div>
      )}
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
        className="overflow-hidden rounded-lg mt-8 flex justify-center"
      >
        <a href="/trends" className="btn-shine inline-block bg-pink-400 text-white px-8 py-3 rounded-lg font-semibold shadow-lg text-lg hover:bg-pink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400">
          Khám phá xu hướng
        </a>
      </motion.div>
    </div>
  );
} 