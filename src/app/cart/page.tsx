"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useCart } from "@/hooks/use-cart";

interface CartItem {
  id: string;
  quantity: number;
  productVariant: {
    id: string;
    price: number;
    size: string;
    color: string;
    product: {
      id: string;
      name: string;
      image: string;
    };
  };
}

export default function CartPage() {
  const { items, isPending, fetchCart, updateQuantity, removeItem } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    fetchCart();
  }, [session]);

  const calculateTotal = () => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // Đồng bộ localStorage mỗi khi items thay đổi
  useEffect(() => {
    if (items.length > 0) {
      // Lưu mảng sản phẩm với các trường cần thiết cho checkout
      const simpleCart = items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
        image: item.image,
        color: item.color,
        size: item.size
      }));
      localStorage.setItem('cart', JSON.stringify(simpleCart));
    } else {
      localStorage.removeItem('cart');
    }
  }, [items]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Đang tải giỏ hàng...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16 pb-8">
      <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-pink-600 mb-8 text-center animate-fade-in">Giỏ hàng</h1>
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Giỏ hàng của bạn đang trống</p>
            <button
              onClick={() => router.push("/products")}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-md hover:scale-105 transition-transform shadow-lg"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden relative animate-fade-in-up">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-100 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-400 rounded-t-2xl">
              <div className="grid grid-cols-5 gap-4 font-semibold text-white text-base drop-shadow">
                <div className="col-span-2">Sản phẩm</div>
                <div>Đơn giá</div>
                <div>Số lượng</div>
                <div>Thành tiền</div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`px-4 py-5 sm:px-6 grid grid-cols-5 gap-4 items-center group transition-colors duration-200 animate-fade-in ${idx % 2 === 0 ? 'bg-white' : 'bg-pink-50'}`}
                >
                  <div className="col-span-2 flex items-center space-x-4">
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden shadow-md">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                        {item.name}
                      </h3>
                      <div className="text-xs text-gray-500 mt-1">
                        Màu: {item.color} | Size: {item.size}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-900 font-semibold">
                    {item.price.toLocaleString("vi-VN")}đ
                  </div>
                  <div>
                    <label htmlFor={`quantity-${item.id}`} className="sr-only">
                      Số lượng
                    </label>
                    <input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border rounded-md text-center font-bold focus:ring-2 focus:ring-pink-400"
                      title="Số lượng sản phẩm"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-900 font-bold">
                      {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-2 text-pink-500 hover:text-pink-700 font-bold text-lg"
                      title="Xóa sản phẩm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 left-0 w-full bg-gradient-to-r from-pink-100 to-fuchsia-100 px-6 py-5 border-t border-pink-200 flex flex-col sm:flex-row justify-between items-center gap-4 z-10 shadow-lg animate-fade-in-up">
              <div className="flex items-center gap-4">
                <span className="text-xl font-extrabold text-pink-700">
                  Tổng cộng: {calculateTotal().toLocaleString("vi-VN")}đ
                </span>
                <span className="inline-block bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                  {items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                </span>
              </div>
              <button
                onClick={() => router.push("/checkout")}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl font-bold text-lg shadow-lg hover:scale-105 hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
              >
                Thanh toán
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}