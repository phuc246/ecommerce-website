'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, ShoppingBag, MoreVertical, ChevronUp } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import OrderDetail from '../OrderDetail';
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useRef } from 'react';
import { getOrderTimeline } from '../OrderDetail';

interface OrderItem {
  id: string;
  productId: string;
  orderId: string;
  name: string;
  price: number;
  quantity: number;
  color: string;
  size: string;
  image: string;
  review?: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  };
  product: {
    id: string;
    name: string;
    image: string;
  };
}

interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

interface Payment {
  id: string;
  orderId: string;
  method: string;
  status: string;
  amount: number;
}

interface Order {
  id: string;
  userId: string;
  status: string;
  total: number;
  addressId: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: Address;
  payment: Payment;
  cancelledAt?: string;
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
}

export default function OrderHistoryTab() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('newest');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedOrderDetail, setExpandedOrderDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Lấy danh sách đơn hàng mới/chưa xem (id+status chưa có trong localStorage)
  const [newlyUpdatedOrderIds, setNewlyUpdatedOrderIds] = useState<string[]>([]);
  useEffect(() => {
    const seenStatus = JSON.parse(localStorage.getItem('ordersSeenStatus') || '[]');
    const newIds = orders.filter(order => {
      return !seenStatus.find((s: any) => s.id === order.id && s.status === order.status);
    }).map(order => order.id);
    setNewlyUpdatedOrderIds(newIds);
  }, [orders]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        setError('Không thể tải đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Xoá useEffect đánh dấu tất cả là đã xem khi vào trang
  // Thêm hàm đánh dấu 1 đơn là đã xem
  const markOrderAsSeen = (order: any) => {
    const seenStatus = JSON.parse(localStorage.getItem('ordersSeenStatus') || '[]');
    // Thêm id+status của đơn này vào seenStatus nếu chưa có
    if (!seenStatus.find((s: any) => s.id === order.id && s.status === order.status)) {
      seenStatus.push({ id: order.id, status: order.status });
      localStorage.setItem('ordersSeenStatus', JSON.stringify(seenStatus));
      // Cập nhật lại state để UI, badge, toast cập nhật đúng
      setNewlyUpdatedOrderIds(prev => prev.filter(id => id !== order.id));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      if (orderFilter === 'all') return true;
      return order.status === orderFilter;
    })
    .sort((a, b) => {
      if (orderSort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (orderSort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (orderSort === 'highest') {
        return b.total - a.total;
      }
      return a.total - b.total;
    });

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    PROCESSING: 'Đã xác nhận',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã huỷ',
    CANCELED: 'Đã huỷ',
    CANCEL_REQUESTED: 'Chờ huỷ',
  };

  // Helper: màu cho trạng thái
  function getStatusColor(status: string) {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'CANCELED': return 'bg-red-100 text-red-800';
      case 'CANCEL_REQUESTED': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-300';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.refresh()}>Try Again</Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Giỏ hàng trống</h3>
        <p className="text-gray-500 mt-1">Hãy xem các sản phẩm tuyệt vời của chúng tôi</p>
        <Button onClick={() => router.push('/products')} className="mt-4">
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-red-400 to-yellow-400 bg-clip-text text-transparent drop-shadow animate-fade-in">Đơn hàng của bạn</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={orderFilter} onValueChange={setOrderFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
              <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
              <SelectItem value="SHIPPED">Đang giao</SelectItem>
              <SelectItem value="DELIVERED">Đã giao</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orderSort} onValueChange={setOrderSort}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="highest">Tổng tiền cao nhất</SelectItem>
              <SelectItem value="lowest">Tổng tiền thấp nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-xl shadow-lg bg-white/80 backdrop-blur-md animate-fade-in max-h-[750px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Mã đơn</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Ngày đặt</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => [
                <tr
                  key={order.id}
                  className={
                    newlyUpdatedOrderIds.includes(order.id)
                      ? 'bg-gradient-to-r from-pink-200 via-pink-100 to-purple-200 animate-pulse border-2 border-pink-300 shadow-lg cursor-pointer'
                      : ''
                  }
                  onClick={() => {
                    if (newlyUpdatedOrderIds.includes(order.id)) markOrderAsSeen(order);
                  }}
                >
                  <td className="px-4 py-2 font-mono font-semibold text-pink-600">{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusColor(order.status)}`}>{STATUS_LABELS[order.status] || order.status}</span>
                  </td>
                  <td className="px-4 py-2 text-blue-600 font-semibold animate-fade-in">{
                    order.items && order.items.length > 0
                      ? order.items.reduce((sum, item) => {
                          const salePrice = (item as any).salePrice;
                          const price = typeof salePrice === 'number' && salePrice > 0 && salePrice < item.price ? salePrice : item.price;
                          return sum + price * item.quantity;
                        }, 0).toLocaleString() + '₫'
                      : (order.total.toLocaleString() + '₫')
                  }</td>
                  <td className="px-4 py-2">{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={async () => {
                        if (expandedOrder === order.id) {
                          setExpandedOrder(null);
                          setExpandedOrderDetail(null);
                        } else {
                          setLoadingDetail(true);
                          setExpandedOrder(order.id);
                          try {
                            const res = await fetch(`/api/orders/${order.id}`);
                            const detail = await res.json();
                            setExpandedOrderDetail(detail);
                          } finally {
                            setLoadingDetail(false);
                          }
                        }
                      }}
                      className="p-2 rounded-full hover:bg-pink-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
                      title="Xem chi tiết đơn hàng"
                    >
                      {expandedOrder === order.id ? <ChevronUp className="w-5 h-5 text-pink-400" /> : <ChevronDown className="w-5 h-5 text-pink-400" />}
                    </button>
                  </td>
                </tr>,
                expandedOrder === order.id && (
                  <tr key={order.id + '-detail'}>
                    <td colSpan={5} className="bg-white/80 p-4 rounded-b-xl shadow-inner animate-fade-in">
                      {loadingDetail ? (
                        <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-pink-400" /></div>
                      ) : expandedOrderDetail ? (
                        <OrderDetail order={expandedOrderDetail} onClose={() => setExpandedOrder(null)} timelineItems={getOrderTimeline(expandedOrderDetail)} />
                      ) : null}
                    </td>
                  </tr>
                )
              ])}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 