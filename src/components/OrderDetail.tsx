"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { StarIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { X, Loader2, ShoppingCart } from "lucide-react";
import { Order, OrderItem, Product } from "@prisma/client";
import { useSession } from "next-auth/react";
import styles from './OrderDetail.module.css';

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
  hideName?: boolean;
}

interface OrderItemWithReview extends OrderItem {
  productVariant?: {
    color?: string;
    size?: string;
    product?: Product;
    image?: string;
    price?: number;
    salePrice?: number;
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
  timelineItems?: any[]; // Thêm props optional timelineItems
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

export default function OrderDetail({ order, onClose, timelineItems }: OrderDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [orderDetail, setOrderDetail] = useState<(OrderDetail & { items: OrderItemWithReview[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [hideName, setHideName] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      const data = await response.json();
      setOrderDetail(data as OrderDetail & { items: OrderItemWithReview[] });
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (productId: string) => {
    if (!rating) {
      toast.error("Vui lòng chọn số sao");
      return;
    }
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
          hideName,
          productVariantId: order.items.find((i) => i.id === selectedItemId)?.productVariantId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Đã gửi đánh giá thành công");
      setSelectedItemId(null);
      setRating(0);
      setComment("");
      setHideName(false);
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
      setHideName(item.review.hideName || false);
    } else {
      setRating(0);
      setComment("");
      setHideName(false);
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

  // Xử lý mốc thời gian trùng nhau giữa từ chối huỷ và đang giao
  let cancelRejectedAt = order.cancelRejectedAt ? new Date(order.cancelRejectedAt) : undefined;
  let shippedAt = order.shippedAt ? new Date(order.shippedAt) : undefined;
  if (cancelRejectedAt && shippedAt && cancelRejectedAt.getTime() === shippedAt.getTime()) {
    // Nếu trùng, cộng thêm 2 giây cho cancelRejectedAt
    cancelRejectedAt = new Date(cancelRejectedAt.getTime() + 2000);
  }

  // Xử lý mốc thời gian trùng nhau giữa xác nhận và chờ xác nhận
  let processingAt = order.processingAt ? new Date(order.processingAt) : undefined;
  let pendingAt = order.pendingAt ? new Date(order.pendingAt) : undefined;
  if (processingAt && pendingAt && processingAt.getTime() === pendingAt.getTime()) {
    // Nếu trùng, cộng thêm 2 giây cho processingAt (xác nhận)
    processingAt = new Date(processingAt.getTime() + 2000);
  }

  const timeline = timelineItems || [
    order.deliveredAt && { label: 'Đã giao', date: new Date(order.deliveredAt), color: 'bg-green-500', active: order.status === 'DELIVERED' },
    shippedAt && { label: 'Đang giao', date: shippedAt, color: 'bg-purple-400', active: order.status === 'SHIPPED' && !order.cancelRejectedAt },
    cancelRejectedAt && { label: order.cancelRejectReason || 'Shop từ chối huỷ', date: cancelRejectedAt, color: 'bg-blue-400', active: order.status === 'SHIPPED' && !!order.cancelRejectedAt },
    processingAt && { label: 'Đã xác nhận', date: processingAt, color: 'bg-blue-400', active: order.status === 'PROCESSING' },
    pendingAt && { label: 'Chờ xác nhận', date: pendingAt, color: 'bg-yellow-400', active: order.status === 'PENDING' },
    order.createdAt && { label: 'Đặt hàng', date: new Date(order.createdAt), color: 'bg-gray-400', active: false },
    order.cancelRequestedAt && { label: 'User yêu cầu huỷ', date: new Date(order.cancelRequestedAt), color: 'bg-pink-400', active: order.status === 'CANCEL_REQUESTED' },
    order.cancelledAt && { label: 'Đã huỷ', date: new Date(order.cancelledAt), color: 'bg-red-500', active: order.status === 'CANCELLED' },
  ].filter(Boolean).sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime());

  // Helper to get user name for review
  const userName = order.address?.fullName || session?.user?.name || 'Người dùng';
  function getMaskedName(name: string, hide: boolean) {
    if (!hide) return name;
    if (name.length <= 2) return name;
    return name[0] + '*****' + name[name.length - 1];
  }

  // Helper tính lại subtotal
  function getItemDisplayPrice(item: OrderItemWithReview) {
    const variant = item.productVariant;
    if (
      variant &&
      typeof variant.salePrice === 'number' &&
      variant.salePrice > 0 &&
      variant.price !== undefined &&
      variant.salePrice < variant.price
    ) {
      return variant.salePrice;
    }
    return (variant && typeof variant.price === 'number') ? variant.price : item.price;
  }
  const computedSubtotal = (orderDetail?.items || []).reduce((sum, item) => sum + (item.quantity * getItemDisplayPrice(item)), 0);
  const computedTotal = computedSubtotal + ((order as any).shippingFee || 0) - ((order as any).discountAmount || 0);

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-6 mt-2 border border-gray-200">
      <h2 className="mb-2 text-2xl font-semibold">Chi tiết đơn hàng</h2>
      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <span className="font-semibold">Đơn hàng #{order.id}</span>
        <div className="flex flex-row-reverse items-center gap-2 w-full md:w-auto justify-end">
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
        </div>
      </div>

      <hr className="my-4 border-gray-200" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {/* Địa chỉ giao hàng */}
        <div>
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
          </div>
        {/* Lịch sử đơn hàng - timeline dọc, mới nhất trên cùng */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-2 mt-4 md:mt-0">Lịch sử đơn hàng</h4>
      <div className="relative flex flex-col gap-2">
            {timeline.slice().reverse().map((item, idx) => {
              // Xác định chấm mới nhất (idx === 0 do timelineItems đã sort giảm dần theo thời gian)
              const isLatest = idx === 0;
              return (
                <div key={idx} className="flex items-center gap-2 relative">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item!.color} ${item!.active ? 'ring-2 ring-pink-400' : ''} ${isLatest ? 'animate-pulse-scale' : ''}`}></span>
                  {/* Đã xoá thanh dọc nối giữa các chấm timeline */}
                  <span className="text-sm text-gray-500">{item!.label}: {new Date(item!.date).toLocaleString('vi-VN')}</span>
          </div>
              );
            })}
          </div>
      <style jsx global>{`
        @keyframes pulse-scale {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        .animate-pulse-scale {
          animation: pulse-scale 1.2s infinite;
        }
      `}</style>
          </div>
      </div>

      {order.status === 'CANCELLED' && order.cancelReason && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4 rounded">
          <span className="font-bold text-red-700">Lý do huỷ đơn hàng:</span> {order.cancelReason}
        </div>
      )}

      <hr className="my-4 border-gray-200" />
      <h4 className="text-sm font-medium text-gray-900">Sản phẩm</h4>
      {(orderDetail?.items as OrderItemWithReview[]).map((item, idx) => {
        if (typeof item.id !== 'string') return null;
        const itemId = item.id;
        return (
          <div key={itemId} className="border rounded-lg p-4 mb-2">
            <div className="flex items-center gap-4 justify-between w-full">
              <div className="flex items-center gap-4 min-w-0">
            <img
                  src={item.productVariant?.image || item.image || item.productVariant?.product?.image || item.product?.image || '/no-image.png'}
              alt={item.productVariant?.product?.name || item.product?.name || 'No image'}
                  className="w-16 h-16 object-cover rounded flex-shrink-0"
            />
                <div className="min-w-0">
                  <h4 className="text-sm font-medium truncate max-w-xs">{item.productVariant?.product?.name || item.product?.name || 'Sản phẩm không xác định'}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    {/* Màu và size bên trái */}
                    {item.productVariant?.color && (
                      <span className="text-xs font-semibold" {...(item.productVariant?.color ? { style: { color: item.productVariant.color } } : {})}>
                        {`Màu: ${item.productVariant.color}`}
                      </span>
                    )}
                    {item.productVariant?.size && (
                      <span className="text-xs text-gray-500 font-medium">{`Size: ${item.productVariant.size}`}</span>
                    )}
                  </div>
                </div>
            </div>
              {/* Số lượng x giá bên phải */}
              <div className="flex flex-col items-end min-w-fit ml-2">
                <span className="text-base font-semibold text-pink-600">
  {item.quantity} × {(() => {
    const variant = item.productVariant;
    if (
      variant &&
      typeof variant.salePrice === 'number' &&
      variant.salePrice > 0 &&
      typeof variant.price === 'number' &&
      variant.salePrice < variant.price
    ) {
      return variant.salePrice.toLocaleString('vi-VN');
    }
    if (variant && typeof variant.price === 'number') {
      return variant.price.toLocaleString('vi-VN');
    }
    return (item.price ?? 0).toLocaleString('vi-VN');
  })()}đ
</span>
                {/* Nút đánh giá hoặc đã đánh giá */}
                {order.status === 'DELIVERED' && (
                  item.review ? (
                    <button
                      type="button"
                      onClick={() => {
                        const productId = item.product?.id || item.productVariant?.product?.id;
                        if (productId) router.push(`/products/${productId}`);
                      }}
                      className="text-green-600 font-bold hover:underline text-xs mt-1 cursor-pointer"
                      title="Xem sản phẩm này"
                    >
                      Đã đánh giá
                    </button>
                  ) : (
            <button
              type="button"
                      onClick={() => handleReviewClick(itemId)}
                      className="text-[#ff9800] font-bold hover:underline text-xs mt-1"
            >
              Đánh giá
            </button>
                  )
                )}
                {/* Nút mua lại cho đơn đã huỷ hoặc đã giao */}
                {(order.status === 'CANCELLED' || order.status === 'DELIVERED') && (
                  <button
                    type="button"
                    onClick={() => {
                      const productId = item.product?.id || item.productVariant?.product?.id;
                      if (productId) router.push(`/products/${productId}`);
                    }}
                    className="mt-2 px-3 py-1 rounded bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-semibold text-xs shadow hover:scale-105 hover:shadow-lg transition-all"
                  >
                    Mua lại
                  </button>
                )}
              </div>
          </div>
            {/* Review form and review display remain unchanged */}
            {selectedItemId && selectedItemId === itemId && (
            <div className="mt-4 space-y-4">
                {/* Nếu đã đánh giá, chỉ hiện nội dung đánh giá, không cho sửa */}
                {item.review ? (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center space-x-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-5 w-5 ${item.review && star <= item.review.rating ? "text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      Người đánh giá: {item.review ? renderReviewerName(item.review) : ''}
                    </div>
                    <div className="text-sm text-gray-700">{item.review?.comment}</div>
                    <div className="text-xs text-gray-400 mt-1">Đã đánh giá lúc: {item.review?.createdAt ? new Date(item.review.createdAt).toLocaleString('vi-VN') : ''}</div>
                  </div>
                ) : (
                  <>
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
                      <div className="mb-2 text-sm text-gray-700 font-semibold flex items-center gap-2">
                        Người đánh giá: <span className="font-bold">{getMaskedName(userName, hideName)}</span>
                      </div>
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
                      <div className="flex items-center mt-2 gap-2">
                        <input
                          type="checkbox"
                          id="hideName"
                          checked={hideName}
                          onChange={e => setHideName(e.target.checked)}
                          className="mr-1"
                        />
                        <label htmlFor="hideName" className="text-xs text-gray-600 select-none cursor-pointer">Ẩn tên khi hiển thị đánh giá</label>
                      </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemId(null);
                    setRating(0);
                    setComment("");
                          setHideName(false);
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
                  </>
                )}
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
        );
      })}

      {/* Block thông tin thanh toán */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6 mb-2">
        <div className="flex justify-between py-1">
          <span>Tổng tiền hàng:</span>
          <span>{computedSubtotal.toLocaleString("vi-VN")}đ</span>
        </div>
        {(order as any).shippingFee !== undefined && (order as any).shippingFee !== null && (
          <div className="flex justify-between py-1">
            <span>Phí vận chuyển:</span>
            <span>{Number((order as any).shippingFee).toLocaleString("vi-VN")}đ</span>
          </div>
        )}
        {(order as any).discountAmount !== undefined && (order as any).discountAmount !== null && (
          <div className="flex justify-between py-1">
            <span>Giảm giá:</span>
            <span className="text-green-600">-{Number((order as any).discountAmount).toLocaleString("vi-VN")}đ</span>
          </div>
        )}
        <div className="flex justify-between py-1 font-bold text-lg">
          <span>Tổng thanh toán:</span>
          <span className="text-pink-600">{computedTotal.toLocaleString("vi-VN")}đ</span>
        </div>
        <div className="flex justify-between py-1">
          <span>Phương thức thanh toán:</span>
          <span>{(order as any).paymentMethod || order.payment?.type || 'Không có thông tin thanh toán'}</span>
        </div>
      </div>
      <div className="flex justify-end mt-2">
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
          <div className="w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-2xl relative animate-fade-in-up">
            <button
              onClick={() => setSelectedItemId(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-pink-500 text-2xl"
              aria-label="Close review form"
              title="Close review form"
            >
              <X className="h-7 w-7" />
            </button>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-center text-pink-600 mb-2">Đánh giá sản phẩm</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-1">Đánh giá</label>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`transition-all duration-150 ${star <= rating ? 'text-yellow-400 scale-110 drop-shadow' : 'text-gray-300'} hover:scale-125 hover:text-yellow-300`}
                        aria-label={`Rate ${star} stars`}
                        title={`Rate ${star} stars`}
                      >
                        <StarIcon className="h-8 w-8" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm text-gray-700 font-semibold flex items-center gap-2">
                    Người đánh giá: <span className="font-bold">{getMaskedName(userName, hideName)}</span>
                  </div>
                  <label htmlFor="comment" className="block text-base font-semibold text-gray-700 mb-1">Nhận xét</label>
                  <textarea
                    id="comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-pink-200 shadow-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-200 text-base p-3 bg-white/90 resize-none"
                    placeholder="Cảm nhận của bạn về sản phẩm..."
                  />
                  <div className="flex items-center mt-2 gap-2">
                    <input
                      type="checkbox"
                      id="hideName-modal"
                      checked={hideName}
                      onChange={e => setHideName(e.target.checked)}
                      className="mr-1"
                    />
                    <label htmlFor="hideName-modal" className="text-xs text-gray-600 select-none cursor-pointer">Ẩn tên khi hiển thị đánh giá</label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItemId(null);
                      setRating(0);
                      setComment("");
                      setHideName(false);
                    }}
                    className="text-base font-medium text-gray-400 hover:text-pink-500 hover:underline px-4 py-2 rounded-lg transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewSubmit(order.items.find((i) => i.id === selectedItemId)?.product?.id || order.items.find((i) => i.id === selectedItemId)?.productVariant?.product?.id || "")}
                    disabled={isSubmitting}
                    className="inline-flex items-center px-6 py-2 text-base font-bold rounded-full shadow bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:scale-105 hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
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

// Helper to render reviewer name (user side: hide if requested, admin: always show full)
function renderReviewerName(review: Review & { userName?: string }) {
  // Nếu là trang admin, luôn show full name (xử lý ở component admin)
  // Ở đây: nếu hideName, chỉ show d*****a
  const name = review.userName || 'Người dùng';
  if (!review.hideName) return name;
  if (name.length <= 2) return name;
  return name[0] + '*****' + name[name.length - 1];
}

// Helper: Tính timeline đơn hàng (cộng 2s cho xác nhận nếu trùng đặt hàng, v.v.)
export function getOrderTimeline(order: any) {
  // Xử lý mốc thời gian trùng nhau giữa từ chối huỷ và đang giao
  let cancelRejectedAt = order.cancelRejectedAt ? new Date(order.cancelRejectedAt) : undefined;
  let shippedAt = order.shippedAt ? new Date(order.shippedAt) : undefined;
  if (cancelRejectedAt && shippedAt && cancelRejectedAt.getTime() === shippedAt.getTime()) {
    // Nếu trùng, cộng thêm 2 giây cho cancelRejectedAt
    cancelRejectedAt = new Date(cancelRejectedAt.getTime() + 2000);
  }

  // Xử lý mốc thời gian trùng nhau giữa xác nhận và chờ xác nhận
  let processingAt = order.processingAt ? new Date(order.processingAt) : undefined;
  let pendingAt = order.pendingAt ? new Date(order.pendingAt) : undefined;
  if (processingAt && pendingAt && processingAt.getTime() === pendingAt.getTime()) {
    // Nếu trùng, cộng thêm 2 giây cho processingAt (xác nhận)
    processingAt = new Date(processingAt.getTime() + 2000);
  }

  const timelineItems = [
    order.createdAt && { label: 'Đặt hàng', date: new Date(order.createdAt), color: 'bg-gray-400', active: false },
    order.pendingAt && { label: 'Chờ xác nhận', date: new Date(order.pendingAt), color: 'bg-yellow-400', active: order.status === 'PENDING' },
    processingAt && { label: 'Đã xác nhận', date: processingAt, color: 'bg-blue-400', active: order.status === 'PROCESSING' },
    shippedAt && { label: 'Đang giao', date: shippedAt, color: 'bg-purple-400', active: order.status === 'SHIPPED' && !order.cancelRejectedAt },
    cancelRejectedAt && { label: order.cancelRejectReason || 'Shop từ chối huỷ', date: cancelRejectedAt, color: 'bg-blue-400', active: order.status === 'SHIPPED' && !!order.cancelRejectedAt },
    order.deliveredAt && { label: 'Đã giao', date: new Date(order.deliveredAt), color: 'bg-green-500', active: order.status === 'DELIVERED' },
    order.cancelRequestedAt && { label: 'User yêu cầu huỷ', date: new Date(order.cancelRequestedAt), color: 'bg-pink-400', active: order.status === 'CANCEL_REQUESTED' },
    order.cancelledAt && { label: 'Đã huỷ', date: new Date(order.cancelledAt), color: 'bg-red-500', active: order.status === 'CANCELLED' },
  ].filter(Boolean);
  return timelineItems;
} 