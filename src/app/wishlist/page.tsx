"use client";

import { useWishlist } from '@/hooks/use-wishlist';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function WishlistPage() {
  const { wishlist, loading, removeFromWishlist } = useWishlist();

  type Attribute = { id?: string; name: string };
  type ProductWithAttributes = typeof wishlist[number] & { attributes?: Attribute[] };

  return (
    <div className="container mx-auto px-4 py-8 min-h-[60vh] bg-pink-50 pt-16">
      <motion.h1
        className="text-3xl md:text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-600 animate-gradient-x drop-shadow-lg text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
      >
        Sản phẩm yêu thích
      </motion.h1>
      {loading ? (
        <div className="text-center text-gray-500 py-12">Đang tải...</div>
      ) : wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="text-center text-gray-400 text-lg mb-2">Bạn chưa có sản phẩm yêu thích nào.</div>
          <Link href="/products" className="px-6 py-2 bg-pink-500 text-white rounded-full font-semibold shadow hover:bg-pink-600 transition">Xem sản phẩm</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((productRaw, idx) => {
            const product = productRaw as ProductWithAttributes;
            return (
              <div key={product.id} className={"relative rounded-2xl overflow-hidden shadow-xl group aspect-[3/4] bg-white flex flex-col justify-end animate-fade-in" + (idx % 2 === 0 ? ' animate-delay-100' : ' animate-delay-200')}>
                <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <Link href={`/products/${product.id}`} className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-5 shadow transition-colors flex items-center justify-center" title="Xem chi tiết">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                  </Link>
                  <button onClick={() => removeFromWishlist(product.id)} className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-5 shadow transition-colors flex items-center justify-center" title="Bỏ khỏi yêu thích">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>
                <div className="relative z-10 px-2 py-2 flex flex-wrap items-center gap-1 justify-center">
                  {Array.isArray(product.attributes) && product.attributes.slice(0, 3).map((attr: Attribute) => (
                    <span key={attr.id || attr.name} className="text-xs bg-pink-100 text-pink-600 rounded-full px-2 py-0.5 font-bold">{attr.name}</span>
                  ))}
                  {Array.isArray(product.attributes) && product.attributes.length > 3 && (
                    <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-bold">+{product.attributes.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 