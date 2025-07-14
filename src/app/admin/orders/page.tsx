"use client";
import OrdersTable from '@/components/admin/OrdersTable';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useRef } from 'react';
import useSWR from 'swr';

interface Log {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string | null;
  details?: string | null;
  admin?: { email?: string | null } | null;
}

interface OrderItem {
  id: string;
  productVariant: {
    id: string;
    price: number;
    salePrice?: number | null;
    color?: string;
    size?: string;
    image?: string;
    product?: { id: string; name: string; image?: string };
  };
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  user?: { name?: string; email?: string };
  items: OrderItem[];
  status: string;
  createdAt: string;
  phone?: string;
  address?: { phone?: string };
  shippingFee?: number;
  discountAmount?: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logFromDate, setLogFromDate] = useState("");
  const [logToDate, setLogToDate] = useState("");
  const [cancelReason, setCancelReason] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const STATUS_LABELS = {
    PENDING: 'Chờ xác nhận',
    PROCESSING: 'Đã xác nhận',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã huỷ',
    CANCEL_REQUESTED: 'Chờ huỷ',
  };

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/orders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${statusFilter}`,
    fetcher
  );

  const orders = data?.orders || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch("/api/admin/logs");
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setLogs(data.filter((log: Log) => log.entity === 'order'));
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchUser = logUserFilter ? (log.admin?.email || '').toLowerCase().includes(logUserFilter.toLowerCase()) : true;
    const logDate = new Date(log.createdAt);
    const fromDate = logFromDate ? new Date(logFromDate) : null;
    const toDate = logToDate ? new Date(logToDate) : null;
    const matchFrom = fromDate ? logDate >= fromDate : true;
    const matchTo = toDate ? logDate <= toDate : true;
    return matchUser && matchFrom && matchTo;
  });

  function renderOrderLogDetail(log: Log) {
    try {
      const detail = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : (log.details || {});
      if (detail.code && detail.before && detail.after) {
        return `${detail.code.slice(0,8)}, ${detail.before} -> ${detail.after}`;
      }
      return '';
    } catch {
      return '';
    }
  }

  function getOrderDisplayTotal(order: Order) {
    function getItemDisplayPrice(item: OrderItem) {
      const variant = item.productVariant;
      if (variant && typeof variant.salePrice === 'number' && variant.salePrice > 0 && variant.salePrice < variant.price) {
        return variant.salePrice;
      }
      return variant?.price ?? item.price;
    }
    const subtotal = (order.items || []).reduce((sum: number, item: OrderItem) => sum + (item.quantity * getItemDisplayPrice(item)), 0);
    return subtotal + (order.shippingFee || 0) - (order.discountAmount || 0);
  }

  async function handleAdminCancel(orderId: string) {
    setProcessingOrderId(orderId);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED', cancelReason: 'Admin xác nhận huỷ theo yêu cầu khách hàng' }),
    });
    setProcessingOrderId(null);
    mutate(); // Re-fetch orders to update the table
    // Có thể thêm toast/thông báo cho user ở đây nếu muốn
  }
  async function handleAdminReject(orderId: string) {
    setProcessingOrderId(orderId);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCEL_REJECTED' }),
    });
    setProcessingOrderId(null);
    mutate(); // Re-fetch orders to update the table
  }

  return (
    <div className=" min-h-screen py-8">
      <div className="max-w-7xl mx-auto bg-white/90 rounded-3xl shadow-2xl p-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-8">Quản lý đơn hàng</h1>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="font-semibold mr-2">Trạng thái:</span>
          <button
            className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${statusFilter === 'ALL' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          >Tất cả</button>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm transition ${
                statusFilter === key
                  ?
                    key === 'PENDING' ? 'bg-yellow-400 text-white' :
                    key === 'PROCESSING' ? 'bg-blue-500 text-white' :
                    key === 'SHIPPED' ? 'bg-purple-500 text-white' :
                    key === 'DELIVERED' ? 'bg-green-500 text-white' :
                    (key === 'CANCELLED' || key === 'CANCELED') ? 'bg-red-500 text-white' :
                    key === 'CANCEL_REQUESTED' ? 'bg-gray-500 text-white' :
                    'bg-blue-500 text-white'
                  :
                    key === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    key === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                    key === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                    key === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    (key === 'CANCELLED' || key === 'CANCELED') ? 'bg-red-100 text-red-800' :
                    key === 'CANCEL_REQUESTED' ? 'bg-gray-200 text-gray-800' :
                    'bg-gray-100 text-gray-700'
              }`}
              onClick={() => { setStatusFilter(key); setPage(1); }}
            >{label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Lọc theo email người thao tác"
            className="border px-2 py-1 rounded text-sm min-w-[220px]"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
              <label className="flex items-center gap-2 text-sm">
                <span>Từ ngày</span>
                <input
                  type="date"
                  className="border px-2 py-1 rounded text-sm"
                  value={logFromDate}
                  onChange={e => setLogFromDate(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span>Đến ngày</span>
                <input
                  type="date"
                  className="border px-2 py-1 rounded text-sm"
                  value={logToDate}
                  onChange={e => setLogToDate(e.target.value)}
                />
              </label>
            </div>
        <div className="w-full min-h-[220px] max-h-[420px] overflow-y-auto mb-2">
          <table className="w-full min-w-full bg-white rounded-xl">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: limit }).map((_, idx) => (
                  <tr key={idx}><td colSpan={7} className="py-8 text-center"><div className="animate-pulse h-6 bg-gray-200 rounded w-1/2 mx-auto" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">Không có đơn hàng nào.</td></tr>
              ) : (
                orders
                  .map((order: Order) => (
                  <tr key={order.id} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-2 font-mono font-bold text-blue-600">{order.id.slice(0,8)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.user?.name || order.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">{order.phone || order.address?.phone || ''}</td>
                    <td className="px-4 py-2 font-semibold text-blue-600">{getOrderDisplayTotal(order).toLocaleString()}₫</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'CANCELLED' || order.status === 'CANCELED' ? 'bg-red-100 text-red-800' :
                        order.status === 'CANCEL_REQUESTED' ? 'bg-gray-200 text-gray-800' : ''
                      }`}>
                        {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-2">
                      {order.status === 'CANCEL_REQUESTED' ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="destructive" className="bg-gradient-to-r from-red-400 to-pink-500 text-white font-bold shadow">Xác nhận huỷ</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[180px]">
                            <div className="px-3 py-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full mb-1"
                                disabled={processingOrderId === order.id}
                                onClick={() => handleAdminCancel(order.id)}
                              >
                                {processingOrderId === order.id ? 'Đang xử lý...' : 'Xác nhận huỷ'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                disabled={processingOrderId === order.id}
                                onClick={() => handleAdminReject(order.id)}
                              >
                                {processingOrderId === order.id ? 'Đang xử lý...' : 'Từ chối huỷ'}
                              </Button>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button size="sm" variant="outline" className="bg-gradient-to-r from-blue-400 to-pink-400 text-white font-bold shadow hover:scale-105 transition-all">Xem chi tiết</Button>
                      </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</Button>
          <span>Trang {page} / {totalPages || 1}</span>
          <Button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>Sau</Button>
        </div>
        <div className="mt-2">
          <h2 className="text-lg font-semibold mb-2">Lịch sử thao tác đơn hàng</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md max-h-[400px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Người thao tác</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingLogs ? (
                  <tr><td colSpan={3} className="text-center py-6">Đang tải log...</td></tr>
                  ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-6 text-gray-500">Chưa có log thao tác nào.</td></tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{log.admin?.email || 'Hệ thống'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs max-w-xs truncate" title={renderOrderLogDetail(log)}>{renderOrderLogDetail(log)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
} 