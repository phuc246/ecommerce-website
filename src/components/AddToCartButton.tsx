'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { ShoppingCart, Loader2, Check } from "lucide-react";

interface AddToCartButtonProps {
  productId: string;
  iconOnly?: boolean;
  variant?: "pink" | "blue" | "custom";
}

export default function AddToCartButton({ productId, iconOnly, variant = "blue" }: AddToCartButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addToCart = async () => {
    if (!session) {
      toast.error("Please sign in to add items to cart");
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
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      toast.success("Added to cart!");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 500);
    } catch (error) {
      toast.error("Failed to add to cart");
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
        loading ? "Adding..." : success ? "Added!" : "Add to Cart"
      )}
    </button>
  );
} 