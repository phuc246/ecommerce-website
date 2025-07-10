'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AddToCartButton from '../AddToCartButton';
import { motion } from 'framer-motion';
import { useWishlist } from '@/hooks/use-wishlist';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: {
    name: string;
  };
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState(0);
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch('/api/products/featured');
        if (!response.ok) {
          throw new Error('Failed to fetch featured products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let scrollAmount = 0;
    const interval = setInterval(() => {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += 2;
      }
    }, 20);
    return () => clearInterval(interval);
  }, [products]);

  useEffect(() => {
    if (!products.length) return;
    const interval = setInterval(() => {
      setHighlighted(idx => (idx + 1) % products.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [products]);

  if (loading) {
    return (
      <div className="flex w-screen overflow-x-auto">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-gray-200 animate-pulse rounded-lg m-2 min-w-[70vw] aspect-[3/4] h-[70vh]"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {products.slice(0, 12).map((product, idx) => (
        <div key={product.id} className="relative w-full h-full max-w-[480px] mx-auto">
          <div className="relative w-full aspect-[3/4] h-auto group rounded-2xl overflow-hidden shadow-lg">
            {idx === 0 && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-20 shadow">Hot</span>
            )}
            <motion.div
              animate={highlighted === idx
                ? { y: [0, -18, 0, -12, 0, -6, 0] }
                : { y: 0 }
              }
              transition={{ duration: 1.2, times: [0, 0.18, 0.36, 0.54, 0.72, 0.9, 1] }}
              className="w-full h-full"
              style={{ borderRadius: 'inherit' }}
            >
              <Image
                src={product.image}
                alt={`Ảnh sản phẩm: ${product.name}`}
                fill
                className="object-cover w-full h-full"
                sizes="(max-width: 640px) 90vw, (max-width: 1200px) 33vw, 16vw"
              />
            </motion.div>
            {/* Overlay action buttons on hover */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 z-10">
              <div className="flex flex-col space-y-4">
                <Link href={`/products/${product.id}`} className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-5 md:p-4 shadow transition-colors flex items-center justify-center" title="Xem chi tiết">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </Link>
                <button
                  className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-5 md:p-4 shadow transition-colors flex items-center justify-center"
                  title={isWishlisted(product.id) ? "Bỏ khỏi yêu thích" : "Yêu thích"}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!session || !session.user) {
                      toast.error('Vui lòng đăng nhập để sử dụng tính năng yêu thích!');
                      return;
                    }
                    try {
                      if (isWishlisted(product.id)) {
                        await removeFromWishlist(product.id);
                      } else {
                        await addToWishlist(product.id);
                      }
                    } catch {
                      // Toast lỗi đã xử lý ở hook
                    }
                  }}
                >
                  <Heart className={isWishlisted(product.id) ? 'fill-pink-500 text-pink-500' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 