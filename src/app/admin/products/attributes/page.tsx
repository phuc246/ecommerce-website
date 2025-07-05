"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Pencil, Trash2, CalendarIcon } from 'lucide-react';
import { Attribute, Log } from '@prisma/client';

// Interfaces
interface UIAttribute extends Attribute {
  _count: {
    productAttributes: number;
  };
}

interface UILog extends Log {
  admin?: { email?: string | null } | null;
  user?: { name: string | null };
  meta?: any;
}

export default function AdminAttributesPage() {
  const { data: session } = useSession();
  const [attributes, setAttributes] = useState<UIAttribute[]>([]);
  const [logs, setLogs] = useState<UILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const [formData, setFormData] = useState({ id: '', name: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Log filters
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logFromDate, setLogFromDate] = useState("");
  const [logToDate, setLogToDate] = useState("");

  // Fetch data
  const fetchAttributes = async () => {
    try {
      const res = await fetch('/api/admin/attributes');
      const data = await res.json();
      setAttributes(data);
    } catch (error) {
      toast.error("Không thể tải thuộc tính.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs?entity=attribute');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      toast.error("Không thể tải lịch sử.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
    fetchLogs();
  }, []);

  const handleEdit = (attribute: UIAttribute) => {
    setIsEditing(true);
    setFormData({ id: attribute.id, name: attribute.name });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({ id: '', name: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const url = isEditing ? `/api/admin/attributes` : '/api/admin/attributes';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(isEditing ? "Cập nhật thất bại" : "Thêm mới thất bại");

      toast.success(isEditing ? 'Cập nhật thành công!' : 'Thêm thuộc tính thành công!');
      handleCancelEdit();
      fetchAttributes();
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thuộc tính này?')) return;
    try {
      const res = await fetch(`/api/admin/attributes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Xóa thất bại");
      toast.success('Xóa thành công!');
      fetchAttributes();
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
        const logDate = new Date(log.createdAt);
        const fromDate = logFromDate ? new Date(logFromDate) : null;
        const toDate = logToDate ? new Date(logToDate) : null;
        if (fromDate) fromDate.setHours(0, 0, 0, 0);
        if (toDate) toDate.setHours(23, 59, 59, 999);

        return (!logUserFilter || log.admin?.email?.toLowerCase().includes(logUserFilter.toLowerCase())) &&
               (!fromDate || logDate >= fromDate) &&
               (!toDate || logDate <= toDate);
    });
  }, [logs, logUserFilter, logFromDate, logToDate]);

  function renderAttributeLogDetail(log: UILog) {
    try {
      const detail = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : (log.details || {});
      // Handle new format with 'changes' key, or fall back to old format
      const changes = detail.changes || detail;

      if (!changes) return `Thực hiện: ${log.action.toLowerCase()}`;

      const beforeName = changes.before?.name ? `#${changes.before.name}` : '';
      // For old CREATE logs, the name might be directly on the detail object
      const afterName = changes.after?.name ? `#${changes.after.name}` : (changes.name ? `#${changes.name}`: '');

      switch (log.action) {
        case 'CREATE':
          return `Tạo: ${afterName}`;
        case 'UPDATE':
          return `Cập nhật: ${beforeName} → ${afterName}`;
        case 'DELETE':
          return `Xóa: ${beforeName}`;
        default:
          return `${log.action}: ---`;
      }
    } catch (e) {
      console.error("Failed to parse log detail:", e);
      return 'Lỗi dữ liệu log.';
    }
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-gray-50/50">
      {/* Left Column */}
      <div className="w-1/3 flex flex-col p-4 space-y-4">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">{isEditing ? 'Chỉnh sửa thuộc tính' : 'Thêm thuộc tính mới'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tên thuộc tính</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="VD: dạo phố, công sở"
                required
              />
            </div>
            <div className="flex space-x-2">
              <button type="submit" disabled={submitting} className="flex-grow bg-pink-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-pink-600 transition duration-300 disabled:bg-gray-400">
                {submitting ? 'Đang xử lý...' : isEditing ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
              {isEditing && (
                <button type="button" onClick={handleCancelEdit} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition">
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Logs Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-grow flex flex-col min-h-0">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Lịch sử thao tác</h3>
          {/* Log Filters */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex">
              <input
                type="text"
                placeholder="Lọc theo email người thao tác"
                className="border px-2 py-1 rounded text-sm w-full"
                value={logUserFilter}
                onChange={(e) => setLogUserFilter(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm w-1/2">
                <span className="w-1/3">Từ ngày</span>
                <input
                  type="date"
                  className="border px-2 py-1 rounded text-sm w-2/3"
                  value={logFromDate}
                  onChange={(e) => setLogFromDate(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm w-1/2">
                <span className="w-1/3">Đến ngày</span>
                <input
                  type="date"
                  className="border px-2 py-1 rounded text-sm w-2/3"
                  value={logToDate}
                  onChange={(e) => setLogToDate(e.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto mt-2 pr-2 -mr-2">
            {loadingLogs ? <p>Đang tải...</p> : (
              <table className="min-w-full text-sm">
                <thead className="bg-pink-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left font-semibold text-gray-600 uppercase">Thời gian</th>
                    <th className="p-2 text-left font-semibold text-gray-600 uppercase">Người thao tác</th>
                    <th className="p-2 text-left font-semibold text-gray-600 uppercase">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.length > 0 ? filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-pink-50/50">
                      <td className="p-2 whitespace-nowrap text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-2 whitespace-nowrap text-gray-500">{log.admin?.email || 'Hệ thống'}</td>
                      <td className="p-2 whitespace-nowrap text-gray-600">{renderAttributeLogDetail(log)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="text-center py-4 text-gray-500">Không có log.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-2/3 flex-grow p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto">
          {loading ? <p>Đang tải thuộc tính...</p> : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-pink-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên thuộc tính</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attributes.length > 0 ? attributes.map((attr) => (
                  <tr key={attr.id} className="hover:bg-pink-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">#{attr.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{attr._count.productAttributes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(attr)} className="text-indigo-600 hover:text-indigo-900 mr-4 p-1 rounded-full hover:bg-gray-200" aria-label="Sửa">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(attr.id)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-200" aria-label="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-500">Chưa có thuộc tính nào.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 