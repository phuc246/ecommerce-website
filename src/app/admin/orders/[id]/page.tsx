import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Không thể tải chi tiết đơn hàng');
        setLoading(false);
      });
  }, [orderId]);

  const handleStatusChange = async (status: string) => {
    setUpdating(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    // reload order
    const res = await fetch(`/api/admin/orders/${orderId}`);
    setOrder(await res.json());
    setUpdating(false);
  };

  if (loading) return <div className="text-center py-12">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 py-12">{error}</div>;
  if (!order) return <div className="text-center py-12">Không tìm thấy đơn hàng</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chi tiết đơn hàng #{order.id.slice(0,8)}</h1>
        <Link href="/admin/orders">
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <div>
              <span className="font-semibold">Khách hàng:</span> {order.user?.name || order.user?.email}
            </div>
            <div>
              <span className="font-semibold">Trạng thái:</span> <Badge>{order.status}</Badge>
              <select
                aria-label="Trạng thái đơn hàng"
                className="ml-2 border rounded px-2 py-1"
                value={order.status}
                disabled={updating}
                onChange={e => handleStatusChange(e.target.value)}
              >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div>
              <span className="font-semibold">Tổng tiền:</span> <span className="text-blue-600 font-bold">{order.total.toLocaleString()}₫</span>
            </div>
            <div>
              <span className="font-semibold">Ngày đặt:</span> {new Date(order.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>
          <div className="mb-2">
            <span className="font-semibold">Địa chỉ giao hàng:</span> {order.shippingAddress}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Phương thức thanh toán:</span> {order.paymentMethod}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-6">
          <h2 className="font-semibold mb-4">Sản phẩm</h2>
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 border-b pb-2 last:border-b-0">
                <img src={item.product?.image || '/images/default.png'} alt={item.product?.name} className="w-16 h-16 object-cover rounded" loading="lazy" width="64" height="64" />
                <div className="flex-1">
                  <div className="font-semibold">{item.product?.name}</div>
                  <div className="text-sm text-gray-500">Số lượng: {item.quantity}</div>
                </div>
                <div className="font-semibold text-blue-600">{item.price.toLocaleString()}₫</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 