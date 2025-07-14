'use client';

import { useState, useEffect, useMemo } from 'react';
import { User, Role } from '@prisma/client';
import toast from 'react-hot-toast';
import Image from "next/image";
import { Search } from 'lucide-react';
// Hàm lấy device info từ PostHog
async function getPosthogDeviceInfo(userId: string, email: string): Promise<any> {
  try {
    // Thử lấy theo userId (distinct_id)
    let res = await fetch(
      `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/api/person/?distinct_id=${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_POSTHOG_KEY}`,
        },
      }
    );
    let data = await res.json();
    if (data.results && data.results.length > 0) {
      const person = data.results[0];
      return {
        os: person.properties?.$os,
        browser: person.properties?.$browser,
        device: person.properties?.$device_type,
        lastSeen: person.properties?.$last_seen_at,
      };
    }
    // Nếu không có, thử lấy theo email
    if (email) {
      res = await fetch(
        `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/api/person/?distinct_id=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_POSTHOG_KEY}`,
          },
        }
      );
      data = await res.json();
      if (data.results && data.results.length > 0) {
        const person = data.results[0];
        return {
          os: person.properties?.$os,
          browser: person.properties?.$browser,
          device: person.properties?.$device_type,
          lastSeen: person.properties?.$last_seen_at,
        };
      }
    }
  } catch (e) { console.error('PostHog fetch error', e); }
  return null;
}

interface UserData extends User {
  phone: string | null;
  totalSpent: number;
}

interface Log {
  id: string;
  createdAt: string;
  action: string;
  detail?: string | null;
  details?: string | null;
  admin?: { email?: string | null } | null;
}

const sortUsers = (users: UserData[]) => {
  return [...users].sort((a, b) => {
    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<Record<string, any>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logFromDate, setLogFromDate] = useState("");
  const [logToDate, setLogToDate] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch("/api/admin/logs?entity=user");
      if (!response.ok) throw new Error("Failed to fetch logs");
      setLogs(await response.json());
    } catch (error) {
      toast.error("Không thể tải lịch sử thao tác.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    // Lấy device info từ PostHog cho từng user
    (async () => {
      const info: Record<string, any> = {};
      for (const user of users) {
        const dev = await getPosthogDeviceInfo(user.id || '', user.email || '');
        if (dev) info[user.id] = dev;
      }
      setDeviceInfo(info);
    })();
  }, []);
  
  const filteredUsers = useMemo(() => {
    const sorted = sortUsers(users);
    if (!searchTerm) return sorted;
    return sorted.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDate = new Date(log.createdAt);
      const fromDate = logFromDate ? new Date(logFromDate) : null;
      const toDate = logToDate ? new Date(logToDate) : null;
      if (fromDate) fromDate.setHours(0, 0, 0, 0);
      if (toDate) toDate.setHours(23, 59, 59, 999);
      return (!logUserFilter || (log.admin?.email || '').toLowerCase().includes(logUserFilter.toLowerCase())) &&
             (!fromDate || logDate >= fromDate) &&
             (!toDate || logDate <= toDate);
    });
  }, [logs, logUserFilter, logFromDate, logToDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  const renderLogDetail = (log: Log) => {
    try {
      const detail = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : (log.details || {});
      if (log.action.toLowerCase().includes('create')) {
        return `Tạo user: ${detail.name || detail.after?.name || ''}`;
      }
      if (log.action.toLowerCase().includes('update')) {
        return `Cập nhật: ${detail.before?.name || ''} → ${detail.after?.name || ''}`;
      }
      if (log.action.toLowerCase().includes('delete')) {
        return `Xoá user: ${detail.before?.name || detail.name || ''}`;
      }
      return `${log.action}: ${log.details || ''}`;
    } catch {
      return log.details || '';
    }
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-gray-50/50">
      {/* Cột chính - Danh sách user */}
      <div className="w-2/3 flex flex-col p-4 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Quản lý người dùng ({users.length})</h1>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
        
        <div className="flex-grow bg-white rounded-lg shadow-sm border border-gray-200 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><p>Đang tải danh sách người dùng...</p></div>
          ) : (
            <table className="min-w-full divide-y divide-pink-100">
              <thead className="bg-pink-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vai trò</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Liên hệ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tổng chi tiêu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lượt xem SP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lượt quay lại</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thiết bị</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cập nhật lần cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-pink-50/50 transition-colors duration-150 ease-in-out">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name || 'Chưa có tên'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone || "Chưa có"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{formatCurrency(user.totalSpent)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{deviceInfo[user.id]?.productViews || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{deviceInfo[user.id]?.repeatVisits || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{(user as any).device || (user as any).lastDevice || deviceInfo[user.id]?.device || deviceInfo[user.id]?.browser || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.updatedAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Cột phụ - Logs */}
      <div className="w-1/3 flex flex-col p-4 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-grow flex flex-col min-h-0">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Lịch sử thao tác</h3>
           <div className="flex flex-col gap-2 mb-4">
              <input
                type="text"
                placeholder="Lọc theo email người thao tác"
                className="border px-2 py-1 rounded text-sm w-full"
                value={logUserFilter}
                onChange={(e) => setLogUserFilter(e.target.value)}
              />
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
                      <td className="p-2 whitespace-nowrap text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-2 whitespace-nowrap text-xs text-gray-500">{log.admin?.email || 'Hệ thống'}</td>
                      <td className="p-2 whitespace-nowrap text-xs max-w-xs truncate" title={renderLogDetail(log)}>{renderLogDetail(log)}</td>
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
    </div>
  );
} 