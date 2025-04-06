'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface AddToCartButtonProps {
  productId: string;
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

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
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      {loading ? "Adding..." : "Add to Cart"}
    </button>
  );
} 