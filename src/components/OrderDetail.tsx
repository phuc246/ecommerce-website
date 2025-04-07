"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { StarIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { X, Loader2, ShoppingCart } from "lucide-react";
import { Order, OrderItem, Product } from "@prisma/client";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  isDefault: boolean;
}

interface Payment {
  id: string;
  type: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  bankName?: string;
  accountNumber?: string;
  isDefault: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface OrderItemWithReview extends OrderItem {
  product: Product;
  review?: Review;
}

interface OrderDetailProps {
  order: Order & {
    items: OrderItemWithReview[];
    address: Address;
    payment: Payment;
  };
  onClose: () => void;
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

export default function OrderDetail({ order, onClose }: OrderDetailProps) {
  const router = useRouter();
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      const data = await response.json();
      setOrderDetail(data);
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
          orderId: order.id,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Đã gửi đánh giá thành công");
      setSelectedItemId(null);
      setRating(0);
      setComment("");
      fetchOrderDetail(); // Refresh order details to show the new review
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Không thể gửi đánh giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      toast.success("Order cancelled successfully");
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorder = async () => {
    try {
      setIsReordering(true);
      const response = await fetch(`/api/orders/${order.id}/reorder`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reorder items");
      }

      toast.success("Items added to cart successfully");
      router.push("/cart");
    } catch (error) {
      console.error("Error reordering items:", error);
      toast.error("Failed to add items to cart");
    } finally {
      setIsReordering(false);
    }
  };

  const handleReviewClick = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = order.items.find((i) => i.id === itemId);
    if (item?.review) {
      setRating(item.review.rating);
      setComment(item.review.comment);
    } else {
      setRating(0);
      setComment("");
    }
  };

  if (loading) {
    return <div className="text-center py-4">Đang tải thông tin đơn hàng...</div>;
  }

  if (!orderDetail) {
    return <div className="text-center py-4">Không tìm thấy thông tin đơn hàng</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          aria-label="Close order details"
          title="Close"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="mb-4 text-2xl font-semibold">Order Details</h2>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Order ID: {order.id}</p>
            <p className="text-sm text-gray-600">
              Date: {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            {(order.status === "PENDING" || order.status === "PROCESSING") && (
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Cancel order"
                title="Cancel order"
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Cancel Order
              </button>
            )}
            {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
              <button
                onClick={handleReorder}
                disabled={isReordering}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Order again"
                title="Order again"
              >
                {isReordering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Order Again
              </button>
            )}
          </div>
        </div>

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
                  : order.status === "SHIPPED"
                  ? "bg-yellow-100 text-yellow-800"
                  : order.status === "PROCESSING"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {order.status === "DELIVERED"
                ? "Đã giao"
                : order.status === "CANCELLED"
                ? "Đã hủy"
                : order.status === "SHIPPED"
                ? "Đang giao"
                : order.status === "PROCESSING"
                ? "Đang xử lý"
                : "Chờ xử lý"}
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
                      onClick={() => handleReviewClick(item.id)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Đánh giá
                    </button>
                  )}
                </div>

                {selectedItemId === item.id && (
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
                            aria-label={`Rate ${star} stars`}
                            title={`Rate ${star} stars`}
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
                          setSelectedItemId(null);
                          setRating(0);
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

                <button
                  onClick={() => handleReviewClick(item.id)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  aria-label="Write a review"
                  title="Write a review"
                >
                  Write a Review
                </button>
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

        {selectedItemId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6">
              <button
                onClick={() => setSelectedItemId(null)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                aria-label="Close review form"
                title="Close review form"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">Đánh giá sản phẩm</h3>
                  </div>
                </div>

                <div className="space-y-4">
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
                          aria-label={`Rate ${star} stars`}
                          title={`Rate ${star} stars`}
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
                        setSelectedItemId(null);
                        setRating(0);
                        setComment("");
                      }}
                      className="text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewSubmit(order.items.find((i) => i.id === selectedItemId)?.product.id || "")}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 