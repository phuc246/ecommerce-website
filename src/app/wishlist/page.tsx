"use client";

import { useWishlist } from '@/hooks/use-wishlist';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlist, loading } = useWishlist();

  return (
    <div className="container mx-auto px-4 py-8 min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-6 text-pink-600">Sản phẩm yêu thích</h1>
      {loading ? (
        <div className="text-center text-gray-500 py-12">Đang tải...</div>
      ) : wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="text-center text-gray-400 text-lg mb-2">Bạn chưa có sản phẩm yêu thích nào.</div>
          <Link href="/" className="px-6 py-2 bg-pink-500 text-white rounded-full font-semibold shadow hover:bg-pink-600 transition">Xem sản phẩm</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center hover:shadow-lg transition">
              <img src={product.image} alt={product.name} className="w-32 h-32 object-cover rounded mb-3" loading="lazy" width="128" height="128" />
              <h2 className="text-lg font-semibold text-center mb-1">{product.name}</h2>
              <p className="text-pink-600 font-bold mb-2">{typeof product.price === 'number' ? product.price.toLocaleString('vi-VN') : 0}₫</p>
              <Link href={`/products/${product.id}`} className="text-sm text-indigo-600 hover:underline">Xem chi tiết</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 