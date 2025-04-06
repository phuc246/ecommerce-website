import { CartItem as CartItemType, Product } from "@prisma/client";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

interface CartItemProps {
  item: CartItemType & {
    product: Product;
  };
}

export default function CartItem({ item }: CartItemProps) {
  const [loading, setLoading] = useState(false);

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/cart/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: newQuantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }

      window.location.reload();
    } catch (error) {
      toast.error("Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cart/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      window.location.reload();
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-6 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-32 w-32 flex-shrink-0">
        <Image
          src={item.product.image}
          alt={item.product.name}
          fill
          className="object-cover rounded-lg"
        />
      </div>
      <div className="flex-grow">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.product.name}</h3>
        <p className="text-blue-600 font-bold text-lg mb-4">${item.product.price.toFixed(2)}</p>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => updateQuantity(item.quantity - 1)}
              disabled={loading || item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.quantity + 1)}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          <button
            onClick={removeItem}
            disabled={loading}
            className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500 mb-1">Subtotal</p>
        <p className="text-xl font-bold text-gray-900">
          ${(item.product.price * item.quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
} 