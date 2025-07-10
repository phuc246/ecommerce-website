"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Image from "next/image";
import { Category, Log } from '@prisma/client';
import { ChevronRight, Pencil, Search, Trash2 } from "lucide-react";

interface CategoryWithSubcategories extends Omit<Category, 'subcategories'> {
  subcategories: CategoryWithSubcategories[];
  productCount?: number;
}

interface UILog extends Log {
  admin?: { email?: string | null } | null;
}

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<CategoryWithSubcategories | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [parentCategory, setParentCategory] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<UILog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logUserFilter, setLogUserFilter] = useState<string>("");
  const [logFromDate, setLogFromDate] = useState<string>("");
  const [logToDate, setLogToDate] = useState<string>("");
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  // Check if user is admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  // Di chuyển fetchCategories ra ngoài useEffect để có thể gọi lại ở handleSubmit
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      const treeData = buildCategoryTree(data);
      setCategories(treeData);
      setParentCategories(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Đưa fetchLogs ra ngoài để có thể gọi lại sau mỗi thao tác thêm/sửa/xoá danh mục để log cập nhật ngay.
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch("/api/admin/logs?entity=category");
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open form for adding or editing
  const handleEdit = (category: CategoryWithSubcategories) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setParentCategory(category.parentId || '');
  };

  // Reset form
  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: "" });
    setParentCategory('');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare the data
      const categoryData = {
        name: formData.name,
        parentId: parentCategory !== '' ? parentCategory : null
      };
      console.log('categoryData gửi lên:', categoryData);

      let response;
      if (editingCategory) {
        // Update existing category
        response = await fetch(`/api/admin/categories?id=${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        });
      } else {
        // Create new category
        response = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${editingCategory ? 'update' : 'create'} category`);
      }

      // Luôn fetch lại toàn bộ danh mục thay vì chỉ cập nhật mảng cũ
      await fetchCategories();

      if (editingCategory) {
        toast.success("Đã cập nhật danh mục");
      } else {
        toast.success("Đã thêm danh mục mới");
      }

      resetForm();
      await fetchLogs();
    } catch (error) {
      console.error(`Error ${editingCategory ? 'updating' : 'creating'} category:`, error);
      toast.error(`Failed to ${editingCategory ? 'update' : 'create'} category`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle category deletion
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Không thể xóa danh mục");
      }

      setCategories(categories.filter((cat) => cat.id !== id));
      toast.success("Đã xóa danh mục");
      await fetchLogs();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error instanceof Error ? error.message : "Không thể xóa danh mục");
    }
  };

  const buildCategoryTree = (categories: Category[]): CategoryWithSubcategories[] => {
    const categoryMap: Record<string, CategoryWithSubcategories> = {};
    categories.forEach(category => {
      const { subcategories, ...rest } = category as any;
      categoryMap[category.id] = { ...rest, subcategories: [] };
    });

    const tree: CategoryWithSubcategories[] = [];
    categories.forEach(category => {
      if (category.parentId && categoryMap[category.parentId]) {
          categoryMap[category.parentId].subcategories.push(categoryMap[category.id]);
      } else {
        tree.push(categoryMap[category.id]);
      }
    });
    return tree;
  };

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function renderCategoryRows(tree: CategoryWithSubcategories[], level = 0): JSX.Element[] {
    const levelBgClasses = [
      'bg-white',        // Level 0
      'bg-pink-50/60',   // Level 1
      'bg-pink-100/60',  // Level 2
      'bg-pink-200/60'   // Level 3+
    ];
    const hoverBgClass = 'hover:bg-fuchsia-100/50';

    const levelPaddingMap: { [key: number]: string } = {
      0: 'pl-3',  // 12px
      1: 'pl-9',  // 36px
      2: 'pl-15', // 60px
      3: 'pl-21', // 84px
    };

    return tree.flatMap(cat => {
      const bgColor = levelBgClasses[Math.min(level, levelBgClasses.length - 1)];
      const paddingClass = levelPaddingMap[level] || 'pl-21'; // Fallback for deep levels

      return [
        <tr key={cat.id} className={`${bgColor} ${hoverBgClass} transition-colors duration-150 ease-in-out`}>
          <td className={`py-3 whitespace-nowrap text-sm font-medium text-gray-800 ${paddingClass}`}>
            <div className="flex items-center">
              {cat.subcategories && cat.subcategories.length > 0 ? (
                <button 
                  onClick={() => toggleExpand(cat.id)} 
                  className="mr-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                  aria-label={expanded[cat.id] ? "Thu gọn" : "Mở rộng"}
                >
                  <ChevronRight size={16} className={`transform transition-transform ${expanded[cat.id] ? 'rotate-90' : ''}`} />
                </button>
              ) : (
                <span className="mr-2 w-7"></span>
              )}
              <span className="ml-1">{cat.name}</span>
            </div>
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-600">
            {cat.subcategories?.length || 0}
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-600">
            {new Date(cat.createdAt).toLocaleDateString()}
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-right">
            <button onClick={() => handleEdit(cat)} className="text-indigo-600 hover:text-indigo-900 mr-4 p-1 rounded-full hover:bg-gray-200" aria-label="Chỉnh sửa">
              <Pencil size={18} />
            </button>
            <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-200" aria-label="Xoá">
              <Trash2 size={18} />
            </button>
          </td>
        </tr>,
        ...(expanded[cat.id] && cat.subcategories ? renderCategoryRows(cat.subcategories, level + 1) : [])
      ]
    });
  }

  // Lọc log theo filter
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

  // Thêm hàm renderCategoryLogDetail
  function renderCategoryLogDetail(log: UILog) {
    try {
      const detailsString = typeof log.details === 'string' ? log.details : JSON.stringify(log.details ?? '{}');
      const detail = JSON.parse(detailsString || '{}');
      if (log.action.toLowerCase().includes('create')) {
        return `Tạo: ${detail.name || detail.after?.name || ''}`;
      }
      if (log.action.toLowerCase().includes('update')) {
        return `Cập nhật: ${detail.before?.name || ''} → ${detail.after?.name || ''}`;
      }
      if (log.action.toLowerCase().includes('delete')) {
        return `Xoá: ${detail.before?.name || detail.name || ''}`;
      }
      return `${log.action}: ${detailsString || ''}`;
    } catch {
      return typeof log.details === 'string' ? log.details : JSON.stringify(log.details ?? '');
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      {/* Left Column - Sticky */}
      <div className="w-1/3 flex flex-col p-4 space-y-4">
        {/* Add/Edit Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm mới danh mục'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
              <select
                id="parentCategory"
                value={parentCategory}
                onChange={(e) => setParentCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">-- Không có --</option>
                {parentCategories.filter(c => c.id !== editingCategory?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-grow bg-pink-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-pink-600 transition duration-300 disabled:bg-gray-400"
              >
                {editingCategory ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition duration-300"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Logs Section */}
        <div className="bg-white p-6 rounded-lg shadow-md flex-grow flex flex-col min-h-0">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Lịch sử thao tác danh mục</h3>
          {/* Filter log */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex">
              <input
                type="text"
                placeholder="Lọc theo email người thao tác"
                className="border px-2 py-1 rounded text-sm w-full"
                value={logUserFilter}
                onChange={e => setLogUserFilter(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm w-1/2">
                <span className="w-1/3">Từ ngày</span>
                <input
                  type="date"
                  className="border px-2 py-1 rounded text-sm w-2/3"
                  value={logFromDate}
                  onChange={e => setLogFromDate(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm w-1/2">
                <span className="w-1/3">Đến ngày</span>
                <input
                  type="date"
                  className="border px-2 py-1 rounded text-sm w-2/3"
                  value={logToDate}
                  onChange={e => setLogToDate(e.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto mt-4 pr-2 -mr-2">
            {loadingLogs ? <p>Đang tải log...</p> : (
              <table className="min-w-full text-sm">
                <thead className="bg-pink-100">
                  <tr>
                    <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thời gian</th>
                    <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.length > 0 ? filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs">{log.userEmail || 'Hệ thống'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs max-w-xs truncate" title={renderCategoryLogDetail(log)}>{renderCategoryLogDetail(log).toString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="text-center py-4 text-gray-500">Không có log nào.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Scrollable */}
      <div className="w-2/3 flex-grow p-4">
        <div className="bg-white rounded-lg shadow-md h-full overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-pink-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên danh mục</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Danh mục con</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-gray-500 py-8">Chưa có danh mục nào.</td></tr>
              ) : (
                renderCategoryRows(categories)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 