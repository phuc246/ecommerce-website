'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface AddToCartButtonProps {
  productId: string;
  colorId?: string;
  sizeId?: string;
  quantity?: number;
  iconOnly?: boolean;
  variant?: "pink" | "blue" | "custom";
}

export default function AddToCartButton({ productId, colorId, sizeId, quantity = 1, iconOnly, variant = "blue" }: AddToCartButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { fetchCart } = useCart();

  const addToCart = async () => {
    if (!session) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      setTimeout(() => router.push('/login'), 1500);
      return;
    }
    if (!colorId || !sizeId) {
      toast.error('Vui lòng chọn màu sắc và kích thước!');
      return;
    }
    if (quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          colorId,
          sizeId,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add to cart");
      }

      await fetchCart();
      toast.success(data.message || "Đã thêm vào giỏ hàng!");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 500);
    } catch (error: any) {
      toast.error(error.message || "Thêm vào giỏ hàng thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={addToCart}
      disabled={loading}
      className={
        iconOnly
          ? variant === "custom"
            ? "bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-4 shadow transition-colors flex items-center justify-center"
            : variant === "pink"
              ? "p-3 rounded-full bg-pink-400 hover:bg-pink-500 text-white shadow transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
              : "p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
          : `w-full py-2 px-4 rounded-md transition-all duration-300 disabled:opacity-50 ${success ? 'bg-green-500 scale-105' : 'bg-blue-600 hover:bg-blue-700'} text-white`
      }
      title={iconOnly ? 'Thêm vào giỏ hàng' : undefined}
      aria-label={iconOnly ? 'Thêm vào giỏ hàng' : undefined}
    >
      {iconOnly ? (
        loading ? <Loader2 className="animate-spin" size={28} /> : success ? <Check size={28} /> : <ShoppingCart size={28} />
      ) : (
        loading ? "Đang thêm..." : success ? "Đã thêm!" : "Thêm vào giỏ hàng"
      )}
    </button>
  );
} 