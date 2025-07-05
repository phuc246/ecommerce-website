"use client";

import { useRef } from "react";
import Image from "next/image";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useMouseMove } from "@/hooks/useMouseMove";

interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    color: {
      name: string;
      value: string;
    };
    size: {
      name: string;
    };
  };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const mouseStyle = useMouseMove(itemRef, 0.1);

  return (
    <div
      ref={itemRef}
      className="relative flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
      style={mouseStyle}
    >
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover object-center"
        />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {item.color.name} / {item.size.name}
            </p>
          </div>
          <p className="text-base font-medium text-gray-900">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(item.price)}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              title="Giảm số lượng"
              aria-label="Giảm số lượng"
            >
              -
            </button>
            <span className="text-gray-900">{item.quantity}</span>
            <button
              type="button"
              className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              title="Tăng số lượng"
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="text-red-600 hover:text-red-800 transition-colors duration-200"
            onClick={() => onRemove(item.id)}
            title="Xóa sản phẩm"
            aria-label="Xóa sản phẩm"
          >
            <TrashIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Interactive hover effect */}
      <div className="absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300 opacity-0 hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/20 to-purple-100/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-white/20" />
      </div>
    </div>
  );
} 