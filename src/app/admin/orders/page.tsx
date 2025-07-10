"use client";
import OrdersTable from '@/components/admin/OrdersTable';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface Log {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string | null;
  details?: string | null;
  admin?: { email?: string | null } | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logFromDate, setLogFromDate] = useState("");
  const [logToDate, setLogToDate] = useState("");

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) throw new Error('Không thể tải đơn hàng');
      const data = await response.json();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải đơn hàng');
      setLoading(false);
    }
  };

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
    fetchOrders();
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

  return (
    <div className=" min-h-screen py-8">
      <div className="max-w-7xl mx-auto bg-white/90 rounded-3xl shadow-2xl p-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-8">Quản lý đơn hàng</h1>
        <div className="flex flex-wrap gap-4 mb-6">
              <input
                type="text"
                placeholder="Lọc theo email người thao tác"
                className="border px-2 py-1 rounded text-sm min-w-[220px]"
                value={logUserFilter}
                onChange={e => setLogUserFilter(e.target.value)}
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">Đang tải...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="text-center text-red-500 py-12">{error}</td></tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-2 font-mono font-bold text-blue-600">{order.id.slice(0,8)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.user?.name || order.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">{order.phone || order.address?.phone || ''}</td>
                    <td className="px-4 py-2 font-semibold text-blue-600">{order.total.toLocaleString()}₫</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'CANCELED' ? 'bg-red-100 text-red-800' : ''
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button size="sm" variant="outline" className="bg-gradient-to-r from-blue-400 to-pink-400 text-white font-bold shadow hover:scale-105 transition-all">Xem chi tiết</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-2">
          <h2 className="text-lg font-semibold mb-2">Lịch sử thao tác đơn hàng</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
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