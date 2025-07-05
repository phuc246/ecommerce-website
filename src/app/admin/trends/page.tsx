'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { Trash2, Edit, Plus } from 'lucide-react';
import ImageCropper, { AspectRatioOption } from '@/components/ImageCropper';

interface Trend {
  id: string;
  name: string;
  image: string;
  createdAt: string;
  productCount?: number;
}

interface Log {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string | null;
  details?: string | null;
  admin?: { email?: string | null } | null;
  userEmail?: string | null;
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);

  const [logs, setLogs] = useState<Log[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logFromDate, setLogFromDate] = useState("");
  const [logToDate, setLogToDate] = useState("");

  // State cho modal chọn sản phẩm
  const [selectingTrend, setSelectingTrend] = useState<Trend | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productLoading, setProductLoading] = useState(false);

  const trendAspectRatioOptions: AspectRatioOption[] = [
    { value: '1.91', label: 'Tự do' },
    { value: 'circle', label: 'Tròn' },
    { value: '1', label: 'Vuông (1:1)' },
    { value: '0.75', label: 'Đứng (3:4)' },
    { value: '1.333', label: 'Ngang (4:3)' },
    { value: '1.777', label: 'Rộng (16:9)' },
  ];

  // Đưa fetchLogs ra ngoài để có thể gọi lại sau mỗi thao tác
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch("/api/admin/logs?entity=trend");
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
    fetchTrends();
    fetchLogs();
  }, []);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trends', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trends');
      }
      
      const data = await response.json();
      setTrends(data);
    } catch (error) {
      console.error('Error fetching trends:', error);
      toast.error('Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File size validation
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Thay vì đặt trực tiếp vào previewUrl, chúng ta sẽ mở ImageCropper
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Hàm mới để xử lý ảnh sau khi cắt
  const handleCropComplete = async (croppedImage: string, shape: 'rect' | 'circle') => {
    setPreviewUrl(croppedImage);
    setCropImage(null);

    // Upload base64 lên Cloudinary qua API upload
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: croppedImage,
          destination: 'trends'
        }),
      });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url); // Lưu URL Cloudinary
      } else {
        toast.error('Lỗi upload ảnh');
        setImageUrl('');
      }
    } catch (err) {
      toast.error('Lỗi upload ảnh');
      setImageUrl('');
    }
  };

  // Hàm mới để hủy cắt ảnh
  const handleCancelCrop = () => {
    setCropImage(null);
  };

  const resetForm = () => {
    setName('');
    setImageUrl('');
    setPreviewUrl(null);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageUrl) {
      toast.error('Name and image are required');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare the data
      const trendData = {
        name,
        image: imageUrl,
      };

      let response;
      if (editingId) {
        // Update existing trend
        response = await fetch(`/api/trends/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trendData),
        });
      } else {
        // Create new trend
        response = await fetch('/api/trends', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trendData),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} trend`);
      }

      toast.success(`Trend ${editingId ? 'updated' : 'created'} successfully`);
      resetForm();
      fetchTrends();
      await fetchLogs();
    } catch (error) {
      console.error(`Error ${editingId ? 'updating' : 'creating'} trend:`, error);
      toast.error(`Failed to ${editingId ? 'update' : 'create'} trend`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (trend: Trend) => {
    setEditingId(trend.id);
    setName(trend.name);
    setImageUrl(trend.image);
    setPreviewUrl(trend.image);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trend?')) {
      return;
    }

    try {
      const response = await fetch(`/api/trends/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trend');
      }

      toast.success('Trend deleted successfully');
      fetchTrends();
      await fetchLogs();
    } catch (error) {
      console.error('Error deleting trend:', error);
      toast.error('Failed to delete trend');
    }
  };

  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.createdAt);
    const from = logFromDate ? new Date(logFromDate) : null;
    const to = logToDate ? new Date(logToDate) : null;
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);
    return (!logUserFilter || log.admin?.email?.toLowerCase().includes(logUserFilter.toLowerCase())) &&
           (!from || logDate >= from) &&
           (!to || logDate <= to);
  });

  function renderTrendLogDetail(log: Log) {
    try {
      const detail = JSON.parse(log.details || '{}');
      if (log.action.toLowerCase().includes('create')) {
        return `Tạo: ${detail.name || detail.after?.name || ''}`;
      }
      if (log.action.toLowerCase().includes('update')) {
        return `Cập nhật: ${detail.before?.name || ''} → ${detail.after?.name || ''}`;
      }
      if (log.action.toLowerCase().includes('delete')) {
        return `Xoá: ${detail.before?.name || detail.name || ''}`;
      }
      return `${log.action}: ${log.details || ''}`;
    } catch {
      return log.details || '';
    }
  }

  // Hàm fetch sản phẩm cho modal
  const fetchProducts = async (search = '', page = 1) => {
    setProductLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&page=${page}&limit=10`);
      const data = await res.json();
      setProducts(data.products || []);
      setProductTotalPages(data.pagination?.pages || 1);
    } catch {
      setProducts([]);
    } finally {
      setProductLoading(false);
    }
  };

  // Khi mở modal chọn sản phẩm
  const openProductModal = async (trend: Trend) => {
    setSelectingTrend(trend);
    setProductModalOpen(true);
    setProductSearch('');
    setProductPage(1);
    setProductLoading(true);
    // Fetch danh sách productId đã thuộc xu hướng
    try {
      const res = await fetch(`/api/trends/${trend.id}`);
      const data = await res.json();
      setSelectedProductIds(data.productIds || []);
    } catch {
      setSelectedProductIds([]);
    }
    fetchProducts('', 1);
    setProductLoading(false);
  };

  // Khi xác nhận chọn sản phẩm
  const handleAddProductsToTrend = async () => {
    if (!selectingTrend) return;
    try {
      await fetch(`/api/trends/${selectingTrend.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProductIds })
      });
      toast.success('Đã thêm sản phẩm vào xu hướng!');
      setProductModalOpen(false);
      setSelectingTrend(null);
      setSelectedProductIds([]);
      await fetchTrends(); // Cập nhật lại số sản phẩm
    } catch (err) {
      toast.error('Lỗi khi thêm sản phẩm vào xu hướng');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-pink-600">Quản lý xu hướng</h1>
      
      {cropImage && (
        <ImageCropper
          image={cropImage}
          onCropDone={handleCropComplete}
          onCancel={handleCancelCrop}
          aspectRatioOptions={trendAspectRatioOptions}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột 1: Form thêm/sửa */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow-sm sticky top-6 z-10 h-[820px] flex flex-col">
            <h2 className="text-lg font-semibold mb-3">{editingId ? 'Chỉnh sửa xu hướng' : 'Thêm mới xu hướng'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
              <div className="flex-grow space-y-4 min-h-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên xu hướng
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Summer Fashion 2023"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ảnh
                  </label>
                  {previewUrl ? (
                    <div className="mt-2 relative w-2/3 mx-auto">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        width={300}
                        height={400}
                        className="w-full object-cover rounded-md aspect-[3/4]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl(null);
                          setImageUrl('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        title="Remove image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex justify-center">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-2/3 flex justify-center items-center p-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-pink-500 aspect-[3/4]"
                      >
                        <div className="space-y-1 text-center">
                          <Plus className="mx-auto h-10 w-10 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            Click thêm ảnh
                          </p>
                          <p className="text-xs text-gray-500">
                            Khung tỉ lệ 3:4
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                    aria-label="Upload trend image"
                    title="Upload trend image"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-4 py-2 bg-pink-400 text-white font-semibold rounded-md hover:bg-pink-500 transition-colors flex-1 disabled:bg-gray-300"
                >
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm xu hướng'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Cột 2: Danh sách xu hướng */}
        <div className="lg:col-span-2">
          <div className="bg-pink-50/50 rounded-lg shadow-inner p-4 max-h-[820px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-10"><p>Đang tải...</p></div>
            ) : trends.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500">Chưa có xu hướng nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {trends.map((trend) => (
                  <div key={trend.id} className="bg-white border rounded-lg overflow-hidden shadow hover:shadow-xl transition-shadow duration-300 flex flex-col">
                    <div className="relative w-full aspect-[3/4]">
                      <Image
                        src={trend.image}
                        alt={trend.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover rounded-t-lg"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-base mb-2 truncate" title={trend.name}>{trend.name}</h3>
                      <div className="text-xs text-gray-500 mb-2">{trend.productCount || 0} sản phẩm</div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(trend)}
                            className="p-2 text-pink-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(trend.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Xoá"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => openProductModal(trend)}
                            className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                            title="Thêm sản phẩm vào xu hướng"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-2">Lịch sử thao tác xu hướng</h2>
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
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
                    <td className="px-4 py-2 whitespace-nowrap text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs">{log.userEmail || 'Hệ thống'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs max-w-xs truncate" title={renderTrendLogDetail(log)}>{renderTrendLogDetail(log)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <h2 className="text-lg font-bold mb-4">Chọn sản phẩm cho xu hướng: <span className="text-pink-500">{selectingTrend?.name}</span></h2>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={productSearch}
              onChange={e => { setProductSearch(e.target.value); fetchProducts(e.target.value, 1); setProductPage(1); }}
              className="border px-3 py-2 rounded w-full mb-3"
            />
            <div className="max-h-64 overflow-y-auto border rounded mb-4">
              {productLoading ? <div className="p-4 text-center">Đang tải...</div> : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2">Chọn</th>
                      <th className="p-2">Tên sản phẩm</th>
                      <th className="p-2">Danh mục</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(product.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedProductIds(ids => [...ids, product.id]);
                              else setSelectedProductIds(ids => ids.filter(id => id !== product.id));
                            }}
                            aria-label={`Chọn sản phẩm ${product.name}`}
                          />
                        </td>
                        <td className="p-2">{product.name}</td>
                        <td className="p-2">{product.category?.name || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-between items-center mb-2">
              <div>
                Trang {productPage}/{productTotalPages}
              </div>
              <div className="space-x-2">
                <button disabled={productPage <= 1} onClick={() => { setProductPage(p => { fetchProducts(productSearch, p - 1); return p - 1; }); }} className="px-2 py-1 border rounded disabled:opacity-50">Trước</button>
                <button disabled={productPage >= productTotalPages} onClick={() => { setProductPage(p => { fetchProducts(productSearch, p + 1); return p + 1; }); }} className="px-2 py-1 border rounded disabled:opacity-50">Sau</button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setProductModalOpen(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-700">Hủy</button>
              <button onClick={handleAddProductsToTrend} className="px-4 py-2 rounded bg-pink-500 text-white font-semibold hover:bg-pink-600">Thêm vào xu hướng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 