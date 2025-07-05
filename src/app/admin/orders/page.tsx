"use client";
import OrdersTable from '@/components/admin/OrdersTable';
import { useEffect, useState } from 'react';

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
  const [error, setError] = useState(null);
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
      if (log.action.toLowerCase().includes('create')) {
        return `Tạo đơn hàng: ${detail.code || detail.after?.code || detail.id || ''}`;
      }
      if (log.action.toLowerCase().includes('update')) {
        return `Chỉnh sửa đơn hàng: ${detail.before?.code || detail.before?.id || ''} → ${detail.after?.code || detail.after?.id || ''}`;
      }
      if (log.action.toLowerCase().includes('delete')) {
        return `Xoá đơn hàng: ${detail.before?.code || detail.code || detail.id || ''}`;
      }
    } catch {
      return log.details || '';
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Quản lý đơn hàng</h1>
      {loading ? (
        <div className="text-center py-12">Đang tải...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : (
        <>
          <OrdersTable orders={orders} />
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-2">Lịch sử thao tác đơn hàng</h2>
            <div className="flex flex-wrap gap-4 mb-4">
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
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Người thao tác</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingLogs ? (
                    <tr><td colSpan={4} className="text-center py-6">Đang tải log...</td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-6 text-gray-500">Chưa có log thao tác nào.</td></tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{log.admin?.email || 'Hệ thống'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{log.action}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs max-w-xs truncate" title={renderOrderLogDetail(log)}>{renderOrderLogDetail(log)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 