import { Product } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { useState, useEffect } from "react";
import { Heart, Eye, ShoppingCart } from "lucide-react";
import { useWishlist } from '@/hooks/use-wishlist';
import { toast } from 'react-hot-toast';
import './ProductCard.css';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product & {
    category: {
      name: string;
    };
    salePrice?: number | null;
    colors?: { name: string; value: string }[];
  };
  isHighlighted?: boolean;
  hideName?: boolean;
}

export default function ProductCard({ product, isHighlighted, hideName }: ProductCardProps) {
  const { isWishlisted, addToWishlist, removeFromWishlist, loading } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const toggleWishlist = async () => {
    try {
      if (wishlisted) {
        await removeFromWishlist(product.id);
        toast.success('Đã bỏ khỏi yêu thích!');
      } else {
        await addToWishlist(product.id);
        toast.success('Đã lưu vào yêu thích!');
      }
    } catch (e) {
      toast.error('Lỗi!');
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden flex flex-col w-full max-w-xs mx-auto min-h-[300px]">
      {/* Product image + hover icons */}
      <div className="relative h-60 sm:h-64 md:h-72 w-full overflow-hidden flex-shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover rounded-t-2xl group-hover:scale-110 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Overlay hover icons giống FeaturedProducts */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-opacity duration-300 z-10">
          <Link href={`/products/${product.id}`} className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-4 shadow transition-colors flex items-center justify-center" title="Xem chi tiết">
            <Eye size={28} />
          </Link>
          <button
            className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-4 shadow transition-colors flex items-center justify-center"
            onClick={toggleWishlist}
            aria-label={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
            title={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
            disabled={loading}
          >
            <Heart size={28} className={wishlisted ? 'text-red-500 fill-red-500' : ''} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <AddToCartButton productId={product.id} iconOnly variant="custom" />
        </div>
      </div>
      {/* Info section chỉ hiển thị category, đổ bóng sâu */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 bg-gradient-to-r from-pink-50 via-pink-100 to-purple-200 rounded-b-2xl shadow-xl">
        <span className="inline-block px-3 py-1 text-sm font-semibold text-pink-600 bg-pink-100 rounded-full shadow">
          {product.category.name}
        </span>
        {!hideName && (
          <h3
            className={`mt-2 text-lg font-semibold line-clamp-2 text-center transition-colors duration-300 
              ${isHighlighted ? 'text-pink-600' : 'text-pink-400'}
              group-hover:text-pink-600
            `}
          >
            {product.name}
          </h3>
        )}
      </div>
    </div>
  );
} 