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
    stock: number; // Added stock field
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
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [outOfStockToRemove, setOutOfStockToRemove] = useState<any[]>([]);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    fetchCart();
  }, [session]);

  // Tính tổng tiền chỉ với sản phẩm còn hàng
  const calculateTotal = () => {
    return items.filter(item => item.stock > 0).reduce(
      (total, item) => total + ((item.salePrice && item.salePrice !== item.price ? item.salePrice : item.price) * item.quantity),
      0
    );
  };
  // Tính tổng số lượng chỉ với sản phẩm còn hàng
  const calculateCount = () => {
    return items.filter(item => item.stock > 0).reduce((sum, item) => sum + item.quantity, 0);
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

  // Sắp xếp: còn hàng lên trên, hết hàng xuống dưới
  const sortedItems = items.slice().sort((a, b) => {
    const aOut = a.stock === 0;
    const bOut = b.stock === 0;
    if (aOut === bOut) return 0;
    return aOut ? 1 : -1;
  });

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
            <div className="min-w-[700px] px-4 py-5 sm:px-8 border-b border-gray-100 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-400 rounded-t-2xl">
              <div className="grid grid-cols-5 gap-6 sm:gap-10 font-semibold text-white text-base drop-shadow">
                <div className="col-span-2 px-2 sm:px-4">Sản phẩm</div>
                <div className="px-2 sm:px-4">Đơn giá</div>
                <div className="px-4 sm:px-8">Số lượng</div>
                <div className="px-2 sm:px-4">Thành tiền</div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {sortedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`min-w-[700px] px-4 py-5 sm:px-8 grid grid-cols-5 gap-6 sm:gap-10 items-center group transition-colors duration-200 animate-fade-in ${idx % 2 === 0 ? 'bg-white' : 'bg-pink-50'} ${item.stock === 0 ? 'opacity-60' : ''}`}
                >
                  <div className="col-span-2 flex items-center space-x-4 px-2 sm:px-4">
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden shadow-md bg-white">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover w-full h-full"
                        style={{ minWidth: 0, minHeight: 0, maxWidth: '100%', maxHeight: '100%' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors truncate max-w-[160px]">
                        {item.name}
                      </h3>
                      <div className="text-xs text-gray-500 mt-1">
                        Màu: {item.color} | Size: {item.size}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-900 font-semibold flex items-center justify-center px-2 sm:px-4">
                    {item.salePrice && item.salePrice < item.price ? (
                      <>
                        <span className="line-through text-gray-400 mr-2">{item.price.toLocaleString("vi-VN")}đ</span>
                        <span className="text-pink-600 font-bold">{item.salePrice.toLocaleString("vi-VN")}đ</span>
                      </>
                    ) : (
                      <span>{item.price.toLocaleString("vi-VN")}đ</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center px-4 sm:px-8">
                    {item.stock === 0 ? (
                      <>
                        <input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          disabled
                          className="w-20 px-2 py-1 border rounded-md text-center font-bold bg-gray-100 text-gray-400"
                          title="Số lượng sản phẩm"
                        />
                        <div className="text-xs text-red-500 font-bold mt-1">Đã hết hàng</div>
                      </>
                    ) : (
                      <>
                        <label htmlFor={`quantity-${item.id}`} className="sr-only">Số lượng</label>
                        <input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateQuantity(item.id, parseInt(e.target.value))}
                          className="w-16 sm:w-20 px-2 py-1 border rounded-md text-center font-bold focus:ring-2 focus:ring-pink-400"
                          title="Số lượng sản phẩm"
                          disabled={item.stock === 0}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2 sm:px-4">
                    <span className="text-gray-900 font-bold">
                      {((item.salePrice && item.salePrice < item.price ? item.salePrice : item.price) * item.quantity).toLocaleString("vi-VN")}đ
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
                  {calculateCount()} sản phẩm
                </span>
              </div>
              <button
                onClick={async () => {
                  const outOfStockItems = items.filter(item => item.stock === 0);
                  const availableItems = items.filter(item => item.stock > 0);
                  if (outOfStockItems.length > 0) {
                    setOutOfStockToRemove(outOfStockItems);
                    setShowOutOfStockModal(true);
                    return;
                  }
                  if (availableItems.length === 0) {
                    alert('Không có sản phẩm nào còn hàng để thanh toán!');
                    return;
                  }
                  router.push("/checkout");
                }}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl font-bold text-lg shadow-lg hover:scale-105 hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
              >
                Thanh toán
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal xoá sản phẩm hết hàng */}
      {showOutOfStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center animate-fade-in-up">
            <div className="text-lg font-semibold text-pink-600 mb-4">Thông báo</div>
            <div className="text-gray-700 mb-6">Có những sản phẩm đã hết hàng, tôi sẽ xoá giúp bạn.<br/>Nhấn <b>Đồng ý</b> để tiếp tục.</div>
            <div className="flex justify-center gap-4">
              <button
                className="px-5 py-2 rounded bg-pink-500 text-white font-bold shadow hover:bg-pink-600 transition"
                onClick={async () => {
                  for (const item of outOfStockToRemove) {
                    await removeItem(item.id);
                  }
                  setShowOutOfStockModal(false);
                  fetchCart();
                }}
              >Đồng ý</button>
              <button
                className="px-5 py-2 rounded bg-gray-200 text-gray-700 font-bold shadow hover:bg-gray-300 transition"
                onClick={() => setShowOutOfStockModal(false)}
              >Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}