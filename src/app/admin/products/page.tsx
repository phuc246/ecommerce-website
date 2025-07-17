"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import ProductTable from "@/components/admin/ProductTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Product as ProductTableProduct } from '@/components/admin/ProductTable';
import useSWR from 'swr';

interface Log {
  id: string;
  createdAt: string;
  userEmail: string | null;
  action: string;
  detail?: string | null;
  details?: any;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logFromDate, setLogFromDate] = useState("");
  const [logToDate, setLogToDate] = useState("");
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);

  const fetcher = (url: string) => fetch(url).then(res => res.json());

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/products?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`,
    fetcher
  );

  const products = (data?.products || []).map((p: any) => ({
    ...p,
    attributes: p.productAttributes?.map((pa: any) => pa.attribute ? { id: pa.attribute.id, name: pa.attribute.name } : null).filter(Boolean) || [],
  }));
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    if (status === "authenticated" && session.user.role === "ADMIN") {
      fetchLogs();
      fetchCategories();
      fetchAttributes();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
    // We don't need to check for status === 'loading' because the layout will handle it.
  }, [session, status, router]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch("/api/admin/logs?entity=product");
      if (!response.ok) throw new Error("Failed to fetch logs");
      setLogs(await response.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not fetch logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Không thể tải danh mục');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      toast.error('Lỗi tải danh mục');
    }
  };

  const fetchAttributes = async () => {
    try {
      const res = await fetch('/api/admin/attributes');
      if (!res.ok) throw new Error('Không thể tải thuộc tính');
      const data = await res.json();
      setAttributes(data);
    } catch (err) {
      toast.error('Lỗi tải thuộc tính');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }
      toast.success("Product deleted successfully");
      mutate(); // Refresh list after deletion
      fetchLogs(); // Refresh logs as well
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred while deleting");
    }
  };

  const handleEdit = async (updatedProduct: any) => {
    await fetch(`/api/admin/products/${updatedProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    });
    mutate();
    fetchLogs();
  };

  const filteredLogs = logs.filter((log) => {
    // Only show logs for create, update, delete actions
    const allowedActions = ['create', 'update', 'delete'];
    const actionMatch = allowedActions.some(action => log.action.toLowerCase().includes(action));
    if (!actionMatch) {
      return false;
    }

    const matchUser = logUserFilter ? (log.userEmail || "").toLowerCase().includes(logUserFilter.toLowerCase()) : true;
    const logDate = new Date(log.createdAt);
    const fromDate = logFromDate ? new Date(logFromDate) : null;
    const toDate = logToDate ? new Date(logToDate) : null;
    const matchFrom = fromDate ? logDate >= fromDate : true;
    const matchTo = toDate ? logDate <= toDate : true;
    return matchUser && matchFrom && matchTo;
  });

  function renderProductLogDetail(log: Log) {
    try {
      let detail = log.details ?? log.detail;
      if (typeof detail === 'string') {
        try { detail = JSON.parse(detail); } catch {}
      }
      let name = '';
      if (typeof detail === 'object' && detail !== null) {
        const d = detail as any;
        name = d.after?.name || d.before?.name || d.name || '';
      }
      if (!name) name = 'Không rõ tên sản phẩm';
      if (log.action.toLowerCase().includes('create')) {
        return `Tạo sản phẩm: ${name}`;
      }
      if (log.action.toLowerCase().includes('update')) {
        return `Chỉnh sửa sản phẩm: ${name}`;
      }
      if (log.action.toLowerCase().includes('delete')) {
        return `Xoá sản phẩm: ${name}`;
      }
    } catch {
      return log.details || log.detail || '';
    }
  }

  if (status === "loading" || !session) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (session.user.role !== "ADMIN") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <Link href="/admin/products/add" className="inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none gap-2 bg-pink-500 text-white hover:bg-pink-600 h-10 px-4 py-2 text-base">
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm sản phẩm
        </Link>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Tìm kiếm theo tên sản phẩm..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
      </div>
      <ProductTable
        products={products}
        loading={isLoading}
        searchTerm={searchTerm}
        onDelete={async (id) => { await handleDelete(id); mutate(); }}
        onEdit={async (p) => { await handleEdit(p); mutate(); }}
        categories={categories}
        attributes={attributes}
        trends={[]}
      />
      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</Button>
        <span>Trang {page} / {totalPages || 1}</span>
        <Button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>Sau</Button>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Lịch sử thao tác sản phẩm</h2>
        <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <Input
            type="text"
            placeholder="Lọc theo email người dùng..."
            className="max-w-xs"
            value={logUserFilter}
            onChange={e => setLogUserFilter(e.target.value)}
          />
           <div className="flex items-center gap-2 text-sm">
            <label htmlFor="logFromDate">Từ ngày</label>
            <Input
              id="logFromDate"
              type="date"
              className="w-auto"
              value={logFromDate}
              onChange={e => setLogFromDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="logToDate">Đến ngày</label>
            <Input
              id="logToDate"
              type="date"
              className="w-auto"
              value={logToDate}
              onChange={e => setLogToDate(e.target.value)}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Người thao tác</TableHead>
                <TableHead>Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingLogs ? (
                <TableRow><TableCell colSpan={3} className="text-center py-6">Đang tải log...</TableCell></TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-6 text-gray-500">Không có log nào.</TableCell></TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="text-sm">{log.userEmail || 'Hệ thống'}</TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-xs max-w-xs truncate" title={renderProductLogDetail(log)}>{renderProductLogDetail(log)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 