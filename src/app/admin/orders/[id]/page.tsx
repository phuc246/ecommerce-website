'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { Dialog } from '@/components/ui/dialog';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  PROCESSING: 'Đã xác nhận',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const statusOptions = [
    { value: 'PENDING', label: 'PENDING' },
    { value: 'PROCESSING', label: 'PROCESSING' },
    { value: 'SHIPPED', label: 'SHIPPED' },
    { value: 'DELIVERED', label: 'DELIVERED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
  ];

  function getNextStatusOptions(current: string) {
    switch (current) {
      case 'PENDING':
        return ['PENDING', 'PROCESSING', 'CANCELLED'];
      case 'PROCESSING':
        return ['PROCESSING', 'SHIPPED', 'CANCELLED'];
      case 'SHIPPED':
        return ['SHIPPED', 'DELIVERED'];
      case 'DELIVERED':
        return ['DELIVERED'];
      case 'CANCELLED':
        return ['CANCELLED'];
      default:
        return [current];
    }
  }

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
    // Lấy log trạng thái
    fetch(`/api/admin/logs?entity=order&entityId=${orderId}`)
      .then(res => res.json())
      .then(data => {
        // Lọc log cập nhật trạng thái
        const logs = Array.isArray(data) ? data.filter((log: any) => log.action === 'Cập nhật trạng thái đơn hàng') : [];
        setStatusLogs(logs);
      });
  }, [orderId]);

  const handleStatusChange = async (status: string) => {
    if (status === 'CANCELLED') {
      setShowCancelModal(true);
      return;
    }
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

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do huỷ đơn hàng!');
      return;
    }
    setUpdating(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED', cancelReason }),
    });
    // reload order
    const res = await fetch(`/api/admin/orders/${orderId}`);
    setOrder(await res.json());
    setUpdating(false);
    setShowCancelModal(false);
    setCancelReason('');
    setCancelError('');
  };

  if (loading) return <div className="text-center py-12">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 py-12">{error}</div>;
  if (!order) return <div className="text-center py-12">Không tìm thấy đơn hàng</div>;

  return (
    <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 min-h-screen py-8">
      <div className="max-w-3xl mx-auto bg-white/90 rounded-3xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" className="bg-gradient-to-r from-blue-400 to-pink-400 text-white font-bold shadow hover:scale-105 transition-all">← Quay lại</Button>
          </Link>
          Chi tiết đơn hàng <span className="text-blue-500">#{order.id.slice(0,8)}</span>
        </h1>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <div className="font-semibold text-gray-700 flex items-center gap-2"><span>👤</span> {order.user?.name || order.user?.email}</div>
            <div className="font-semibold text-gray-700 flex items-center gap-2"><span>📞</span> {order.phone || order.shippingPhone || order.user?.phone || 'Không có số điện thoại'}</div>
            <div className="font-semibold text-gray-700 flex items-center gap-2"><span>📧</span> {order.user?.email}</div>
            <div className="font-semibold text-gray-700 flex items-center gap-2"><span>📍</span> {order.shippingAddress}</div>
            <div className="font-semibold text-gray-700 flex items-center gap-2"><span>💳</span> {order.paymentMethod}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-block px-4 py-2 rounded-full text-lg font-bold shadow-sm ${
                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''
              }`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <select
                aria-label="Trạng thái đơn hàng"
                className="ml-2 border rounded px-2 py-1"
                value={order.status}
                disabled={updating}
                onChange={e => handleStatusChange(e.target.value)}
              >
                {statusOptions.filter(opt => getNextStatusOptions(order.status).includes(opt.value)).map(opt => (
                  <option key={opt.value} value={opt.value}>{STATUS_LABELS[opt.value] || opt.value}</option>
                ))}
              </select>
            </div>
            <div className="font-semibold text-gray-700">Tổng tiền: <span className="text-blue-600 font-bold">{order.total.toLocaleString()}₫</span></div>
            <div className="font-semibold text-gray-700">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</div>
            {order.pendingAt && <div className="text-sm text-gray-500">Chờ xác nhận: {new Date(order.pendingAt).toLocaleString('vi-VN')}</div>}
            {order.processingAt && <div className="text-sm text-gray-500">Đã xác nhận: {new Date(order.processingAt).toLocaleString('vi-VN')}</div>}
            {order.shippedAt && <div className="text-sm text-gray-500">Đang giao: {new Date(order.shippedAt).toLocaleString('vi-VN')}</div>}
            {order.deliveredAt && <div className="text-sm text-gray-500">Đã giao: {new Date(order.deliveredAt).toLocaleString('vi-VN')}</div>}
            {order.cancelledAt && <div className="text-sm text-gray-500">Đã hủy: {new Date(order.cancelledAt).toLocaleString('vi-VN')}</div>}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4">Sản phẩm</h2>
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 border-b pb-2 last:border-b-0 hover:bg-blue-50 rounded-lg transition">
                <img src={item.productVariant?.product?.image || '/no-image.png'} alt={item.productVariant?.product?.name} className="w-20 h-20 object-cover rounded-xl border shadow" loading="lazy" width="80" height="80" />
                <div className="flex-1">
                  <div className="font-semibold text-lg">{item.productVariant?.product?.name}</div>
                  <div className="text-sm text-gray-500">Màu: {item.productVariant?.color} | Size: {item.productVariant?.size}</div>
                  <div className="text-sm text-gray-500">Số lượng: {item.quantity}</div>
                </div>
                <div className="font-semibold text-blue-600 text-lg">{item.price.toLocaleString()}₫</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-2">Nhập lý do huỷ đơn hàng</h2>
            <textarea
              className="w-full border rounded p-2 mb-2"
              rows={3}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Nhập lý do huỷ..."
            />
            {cancelError && <div className="text-red-500 text-sm mb-2">{cancelError}</div>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>Huỷ</Button>
              <Button variant="destructive" onClick={handleConfirmCancel} disabled={updating}>
                Xác nhận huỷ
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
} 