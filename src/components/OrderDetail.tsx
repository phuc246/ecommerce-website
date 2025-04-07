"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { StarIcon } from "@heroicons/react/24/solid";

interface OrderDetailProps {
  orderId: string;
  onClose: () => void;
}

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    image: string;
  };
  quantity: number;
  price: number;
  review?: {
    rating: number;
    comment: string;
  };
}

interface OrderDetail {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  address: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
  };
  payment: {
    type: string;
    cardNumber?: string;
    bankName?: string;
    accountNumber?: string;
  };
  items: OrderItem[];
}

export default function OrderDetail({ orderId, onClose }: OrderDetailProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (productId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Đã gửi đánh giá thành công");
      setSelectedItem(null);
      setRating(5);
      setComment("");
      fetchOrderDetail(); // Refresh order details to show the new review
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Không thể gửi đánh giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Đang tải thông tin đơn hàng...</div>;
  }

  if (!order) {
    return <div className="text-center py-4">Không tìm thấy thông tin đơn hàng</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">Đơn hàng #{order.id}</h3>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            order.status === "DELIVERED"
              ? "bg-green-100 text-green-800"
              : order.status === "CANCELLED"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {order.status === "DELIVERED"
            ? "Đã giao"
            : order.status === "CANCELLED"
            ? "Đã hủy"
            : "Đang xử lý"}
        </span>
      </div>

      <div className="border-t border-b border-gray-200 py-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Địa chỉ giao hàng</h4>
        <p className="text-sm text-gray-500">{order.address.fullName}</p>
        <p className="text-sm text-gray-500">{order.address.phone}</p>
        <p className="text-sm text-gray-500">
          {order.address.address}, {order.address.ward}, {order.address.district},{" "}
          {order.address.city}
        </p>
      </div>

      <div className="border-b border-gray-200 py-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Phương thức thanh toán</h4>
        {order.payment.type === "credit_card" ? (
          <p className="text-sm text-gray-500">
            Thẻ tín dụng (**** **** **** {order.payment.cardNumber?.slice(-4)})
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Chuyển khoản - {order.payment.bankName} ({order.payment.accountNumber})
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Sản phẩm</h4>
        {order.items.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="text-sm font-medium">{item.product.name}</h4>
                <p className="text-sm text-gray-500">
                  {item.quantity} x {item.price.toLocaleString("vi-VN")}đ
                </p>
              </div>
              {order.status === "DELIVERED" && !item.review && (
                <button
                  type="button"
                  onClick={() => setSelectedItem(item.product.id)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Đánh giá
                </button>
              )}
            </div>

            {selectedItem === item.product.id && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Đánh giá</label>
                  <div className="flex items-center space-x-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`${
                          star <= rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        <StarIcon className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nhận xét
                  </label>
                  <textarea
                    id="comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                      setRating(5);
                      setComment("");
                    }}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewSubmit(item.product.id)}
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </div>
              </div>
            )}

            {item.review && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`h-4 w-4 ${
                        star <= item.review!.rating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-sm text-gray-500">{item.review.comment}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
        <p className="text-lg font-medium">
          Tổng cộng: {order.total.toLocaleString("vi-VN")}đ
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Đóng
        </button>
      </div>
    </div>
  );
} 