"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useWishlist } from '@/hooks/use-wishlist';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
}

export default function WishlistTab() {
  const { wishlist, loading, removeFromWishlist, isPending = false } = useWishlist();

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl shadow p-4 animate-pulse h-64 flex flex-col">
          <div className="w-full h-40 bg-gray-200 rounded mb-2" />
          <div className="h-5 bg-gray-200 rounded mb-1 w-2/3" />
          <div className="h-6 bg-gray-300 rounded mb-2 w-1/2" />
          <div className="h-8 bg-gray-200 rounded mt-auto w-full" />
        </div>
      ))}
    </div>
  );
  if (wishlist.length === 0) return <div className="py-8 text-center">Chưa có sản phẩm yêu thích.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {wishlist.map(product => (
        <div key={product.id} className="bg-white rounded-xl shadow p-4 flex flex-col">
          <Link href={`/products/${product.id}`}>
            <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded mb-2" loading="lazy" width="160" height="160" />
            <div className="font-semibold text-lg mb-1">{product.name}</div>
            <div className="text-blue-600 font-bold text-xl mb-2">{product.price.toLocaleString()}₫</div>
          </Link>
          <button className="mt-auto px-3 py-2 rounded border border-gray-300 hover:bg-gray-100" onClick={() => {
            removeFromWishlist(product.id, (ok, msg) => {
              if (ok) toast.success('Đã bỏ khỏi yêu thích!');
              else toast.error(msg || 'Lỗi!');
            });
          }} disabled={isPending}>
            Bỏ khỏi yêu thích
          </button>
        </div>
      ))}
    </div>
  );
} 