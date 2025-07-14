import { Product } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { useState, useEffect } from "react";
import { Heart, Eye, ShoppingCart } from "lucide-react";
import { useWishlist } from '@/hooks/use-wishlist';
import { toast } from 'sonner';
import './ProductCard.css';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

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
  const { data: session } = useSession();
  const wishlisted = isWishlisted(product.id);
  const toggleWishlist = async () => {
    if (!session || !session.user) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng yêu thích!');
      return;
    }
    try {
      if (wishlisted) {
        const ok = await removeFromWishlist(product.id);
        // Không hiện toast ở đây, đã xử lý ở hook
      } else {
        const ok = await addToWishlist(product.id);
        // Không hiện toast ở đây, đã xử lý ở hook
      }
    } catch {
      // Không hiện toast ở đây, đã xử lý ở hook
    }
  };

  // Lưu lại ảnh chính ban đầu
  const mainImageDefault = product.image;
  const [mainImage, setMainImage] = useState(mainImageDefault);
  useEffect(() => { setMainImage(mainImageDefault); }, [mainImageDefault]);
  // Lấy danh sách thumbnail biến thể (nếu có)
  const variantThumbnails = Array.isArray((product as any).variants)
    ? (product as any).variants.filter((v: any) => v.image).map((v: any) => ({ id: v.id, image: v.image, color: v.color }))
    : [];

  type VariantThumb = { id: string; image: string; color: string };

  return (
    <div className="group relative bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden flex flex-col w-full max-w-xs mx-auto min-h-[300px]">
      {/* Product image + hover icons */}
      <div className="relative h-60 sm:h-64 md:h-72 w-full overflow-hidden flex-shrink-0 group/image">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          className="object-cover rounded-t-2xl group-hover/image:scale-110 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Overlay hover icons chỉ hiện khi hover vào ảnh lớn */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/image:opacity-100 flex flex-col items-center justify-center gap-4 transition-opacity duration-300 z-10 pointer-events-none">
          <Link href={`/products/${product.id}`} className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-4 shadow transition-colors flex items-center justify-center pointer-events-auto" title="Xem chi tiết">
            <Eye size={28} />
          </Link>
          <button
            className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-4 shadow transition-colors flex items-center justify-center pointer-events-auto"
            onClick={toggleWishlist}
            aria-label={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
            title={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
            disabled={loading}
          >
            <Heart size={28} className={wishlisted ? 'text-red-500 fill-red-500' : ''} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      {/* Info section chỉ hiển thị category, đổ bóng sâu */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 bg-gradient-to-r from-pink-50 via-pink-100 to-purple-200 rounded-b-2xl shadow-xl">
        {variantThumbnails.length > 0 && (
          <div className="flex gap-1 mb-2"
            onMouseLeave={() => setMainImage(mainImageDefault)}
          >
            {variantThumbnails.map((v: VariantThumb, idx: number) => (
              <img
                key={v.id + '-' + idx}
                src={v.image}
                alt={v.color}
                className={`w-7 h-7 rounded border object-cover cursor-pointer hover:scale-110 transition-transform ${mainImage === v.image ? 'ring-2 ring-pink-500' : ''}`}
                onMouseEnter={() => setMainImage(v.image)}
                onClick={() => setMainImage(v.image)}
                title={v.color}
              />
            ))}
          </div>
        )}
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