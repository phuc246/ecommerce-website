'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, ShoppingBag } from 'lucide-react';
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
}

export default function OrderHistoryTab() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('newest');

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
        <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
        <p className="text-gray-500 mt-1">You haven't placed any orders yet.</p>
        <Button onClick={() => router.push('/products')} className="mt-4">
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-medium">Your Orders</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={orderFilter} onValueChange={setOrderFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={orderSort} onValueChange={setOrderSort}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Amount</SelectItem>
              <SelectItem value="lowest">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-2">{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-2"><Badge>{order.status}</Badge></td>
                  <td className="px-4 py-2 text-blue-600 font-semibold">{order.total.toLocaleString()}₫</td>
                  <td className="px-4 py-2">{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-2">
                    <Link href={`/profile/orders/${order.id}`}>
                      <Button size="sm" variant="outline">Xem</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (() => {
        const o = orders.find(o => o.id === selectedOrder)!;
        return (
          <OrderDetail
            order={{
              ...o,
              status: o.status as OrderStatus,
              shippingAddress: o.address?.address || '',
              paymentMethod: o.payment?.method || '',
              createdAt: new Date(o.createdAt),
              updatedAt: new Date(o.updatedAt),
              items: o.items as any,
              address: o.address as any,
              payment: o.payment as any,
            }}
            onClose={() => setSelectedOrder(null)}
          />
        );
      })()}
    </div>
  );
} 