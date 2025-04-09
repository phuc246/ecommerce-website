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
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import OrderDetail from '../OrderDetail';

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

interface OrderHistoryTabProps {
  userId: string;
}

export default function OrderHistoryTab({ userId }: OrderHistoryTabProps) {
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
        const response = await fetch(`/api/users/${userId}/orders`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Could not load your order history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchOrders();
    }
  }, [userId]);

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
        {filteredOrders.map((order) => (
          <div 
            key={order.id} 
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">Order #{order.id}</h4>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : order.status === "SHIPPED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.status === "DELIVERED"
                        ? "Delivered"
                        : order.status === "CANCELLED"
                        ? "Cancelled"
                        : order.status === "SHIPPED"
                        ? "Shipped"
                        : order.status === "PROCESSING"
                        ? "Processing"
                        : "Pending"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(order.createdAt), 'PPP')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {order.total.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-3">
                  {/* Preview first 2 items */}
                  {order.items.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.color && `Color: ${item.color}`}
                          {item.size && item.color && ' | '}
                          {item.size && `Size: ${item.size}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} x {item.price.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show more items indicator */}
                  {order.items.length > 2 && (
                    <p className="text-sm text-gray-500 italic">
                      + {order.items.length - 2} more items
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedOrder(order.id)}
                  className="text-sm"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetail
          order={orders.find(order => order.id === selectedOrder)!}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
} 