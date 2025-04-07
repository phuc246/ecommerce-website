"use client";

import { CartItem as CartItemType, Product } from "@prisma/client";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

interface CartItemProps {
  item: CartItemType & {
    product: Product;
  };
  onQuantityChange: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
}

export default function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const response = await fetch(`/api/cart/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }

      setQuantity(newQuantity);
      onQuantityChange(item.id, newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Không thể cập nhật số lượng");
    }
  };

  const handleRemove = async () => {
    try {
      const response = await fetch(`/api/cart/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      onRemove(item.id);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Không thể xóa sản phẩm");
    }
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b">
      <div className="relative w-24 h-24">
        <Image
          src={item.product.image}
          alt={item.product.name}
          fill
          className="object-cover rounded-md"
        />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-medium">{item.product.name}</h3>
        <p className="text-gray-600">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(item.product.price)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          >
            -
          </button>
          <span className="w-8 text-center">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          >
            +
          </button>
          <button
            onClick={handleRemove}
            className="ml-4 text-sm text-red-600 hover:text-red-500"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
} 