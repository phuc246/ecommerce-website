"use client";

import { useState, useEffect } from "react";
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
  productVariant?: {
    color?: string;
    size?: string;
    product?: Product;
    image?: string;
  };
  product?: Product;
  review?: Review;
  image?: string;
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

  useEffect(() => {
    setLoading(true);
    fetchOrderDetail();
    // eslint-disable-next-line
  }, [order.id]);

  if (loading) {
    return <div className="text-center py-4">Đang tải thông tin đơn hàng...</div>;
  }

  if (!orderDetail) {
    return <div className="text-center py-4">Không tìm thấy thông tin đơn hàng</div>;
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-6 mt-2 border border-gray-200">
      <h2 className="mb-2 text-2xl font-semibold">Chi tiết đơn hàng</h2>
      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">Đơn hàng #{order.id}</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            order.status === "DELIVERED"
              ? "bg-green-100 text-green-800"
              : order.status === "CANCELLED"
              ? "bg-red-100 text-red-800"
              : order.status === "SHIPPED"
              ? "bg-yellow-100 text-yellow-800"
              : order.status === "PROCESSING"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-yellow-100 text-yellow-800"
          }`}>{order.status === "DELIVERED"
            ? "Đã giao"
            : order.status === "CANCELLED"
            ? "Đã hủy"
            : order.status === "SHIPPED"
            ? "Đang giao"
            : order.status === "PROCESSING"
            ? "Đang xử lý"
            : "Chờ xử lý"}
          </span>
          {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
            <button
              onClick={async () => {
                setIsReordering(true);
                try {
                  const response = await fetch(`/api/orders/${order.id}/reorder`, { method: 'POST' });
                  if (!response.ok) throw new Error('Lỗi khi thêm lại sản phẩm vào giỏ hàng');
                  toast.success('Đã thêm lại sản phẩm vào giỏ hàng!');
                  router.push('/cart');
                } catch (err) {
                  toast.error('Không thể thêm lại sản phẩm vào giỏ hàng');
                } finally {
                  setIsReordering(false);
                }
              }}
              disabled={isReordering}
              className="flex items-center gap-2 rounded-md bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 px-5 py-2 text-white font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Đặt lại"
              title="Đặt lại"
            >
              {isReordering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
              Đặt lại
            </button>
          )}
          {(order.status === "PENDING" || order.status === "PROCESSING") && (
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Huỷ đơn hàng"
              title="Huỷ đơn hàng"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Huỷ đơn hàng
            </button>
          )}
        </div>
      </div>

      <hr className="my-4 border-gray-200" />
      <h4 className="text-sm font-medium text-gray-900 mb-2">Địa chỉ giao hàng</h4>
      {order.address?.fullName || (order as any).shippingName ? (
        <p className="text-sm text-gray-500 flex items-center gap-1"><span role="img" aria-label="user">👤</span> {order.address?.fullName || (order as any).shippingName}</p>
      ) : null}
      {order.address?.phone || order.phone ? (
        <p className="text-sm text-gray-500 flex items-center gap-1"><span role="img" aria-label="phone">📞</span> {order.address?.phone || order.phone}</p>
      ) : null}
      {(order as any).shippingEmail ? (
        <p className="text-sm text-gray-500 flex items-center gap-1"><span role="img" aria-label="mail">✉️</span> {(order as any).shippingEmail}</p>
      ) : null}
      {order.address ? (
        <p className="text-sm text-gray-500 flex items-center gap-1"><span role="img" aria-label="location">📍</span> {`${order.address.address}, ${order.address.ward}, ${order.address.district}, ${order.address.city}`}</p>
      ) : order.shippingAddress ? (
        <p className="text-sm text-gray-500 flex items-center gap-1"><span role="img" aria-label="location">📍</span> {order.shippingAddress}</p>
      ) : null}

      <hr className="my-4 border-gray-200" />
      <h4 className="text-sm font-medium text-gray-900 mb-2">Phương thức thanh toán</h4>
      <p className="text-sm text-gray-500">{order.paymentMethod || order.payment?.type || 'Không có thông tin thanh toán'}</p>

      <hr className="my-4 border-gray-200" />
      <h4 className="text-sm font-bold text-gray-900 mb-2 mt-4">Lịch sử đơn hàng</h4>
      <div className="space-y-2">
        {order.createdAt && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0"></span>
            <span className="text-sm text-gray-500">Đặt hàng: {new Date(order.createdAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
        {order.pendingAt && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0"></span>
            <span className="text-sm text-gray-500">Chờ xác nhận: {new Date(order.pendingAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
        {order.processingAt && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0"></span>
            <span className="text-sm text-gray-500">Đã xác nhận: {new Date(order.processingAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
        {order.shippedAt && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-400 flex-shrink-0"></span>
            <span className="text-sm text-gray-500">Đang giao: {new Date(order.shippedAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
        {order.deliveredAt && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></span>
            <span className="text-sm text-gray-500">Đã giao: {new Date(order.deliveredAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
        {order.cancelledAt && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></span>
            <span className="text-sm text-gray-500">Đã huỷ: {new Date(order.cancelledAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
      </div>

      {order.status === 'CANCELLED' && order.cancelReason && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4 rounded">
          <span className="font-bold text-red-700">Lý do huỷ đơn hàng:</span> {order.cancelReason}
        </div>
      )}

      <hr className="my-4 border-gray-200" />
      <h4 className="text-sm font-medium text-gray-900">Sản phẩm</h4>
      {(orderDetail?.items as OrderItemWithReview[]).map((item) => (
        <div key={item.id} className="border rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <img
              src={item.productVariant?.product?.image || item.product?.image || item.image || '/no-image.png'}
              alt={item.productVariant?.product?.name || item.product?.name || 'No image'}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <h4 className="text-sm font-medium">{item.productVariant?.product?.name || item.product?.name || 'Sản phẩm không xác định'}</h4>
              <p className="text-sm text-gray-500">
                {item.quantity} x {item.price.toLocaleString("vi-VN")}đ
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleReviewClick(item.id)}
              className="text-[#ff9800] font-bold hover:underline text-sm ml-auto"
            >
              Đánh giá
            </button>
          </div>

          {selectedItemId && selectedItemId === item.id && (
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
                  onClick={() => handleReviewSubmit(order.items.find((i) => i.id === selectedItemId)?.product?.id || order.items.find((i) => i.id === selectedItemId)?.productVariant?.product?.id || "")}
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
                    className={`h-4 w-4 ${item.review && star <= item.review.rating ? "text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500">{item.review?.comment}</p>
            </div>
          )}
        </div>
      ))}

      <hr className="my-4 border-gray-200" />
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
                    onClick={() => handleReviewSubmit(order.items.find((i) => i.id === selectedItemId)?.product?.id || order.items.find((i) => i.id === selectedItemId)?.productVariant?.product?.id || "")}
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
  );
} 