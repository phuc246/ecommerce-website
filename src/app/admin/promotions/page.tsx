"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Pencil, Trash2, UploadCloud } from 'lucide-react';
import { Promotion, Log, DiscountType } from '@prisma/client';
import Image from 'next/image';

// Interfaces
interface UILog extends Log {
  admin?: { email?: string | null } | null;
}

interface PromotionFormData {
    id?: string;
    code: string;
    backgroundImage?: string | null;
    discountType: DiscountType;
    discountValue: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    usageLimit: number;
}

const promotionTypes = {
  FIXED_AMOUNT: 'Giá cố định',
  PERCENTAGE: 'Phần trăm',
};

const initialFormData: PromotionFormData = {
    code: '',
    backgroundImage: null,
    discountType: 'FIXED_AMOUNT',
    discountValue: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: 100,
};

export default function AdminPromotionsPage() {
  const { data: session } = useSession();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [logs, setLogs] = useState<UILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const [formData, setFormData] = useState<PromotionFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log filters
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logFromDate, setLogFromDate] = useState("");
  const [logToDate, setLogToDate] = useState("");

  // Fetch data
  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/admin/promotions');
      const data = await res.json();
      setPromotions(data);
    } catch (error) {
      toast.error("Không thể tải mã giảm giá.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/logs?entity=promotion');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      toast.error("Không thể tải lịch sử.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchLogs();
  }, []);
  
  const handleEdit = (promo: Promotion) => {
    setIsEditing(true);
    setFormData({
        id: promo.id,
        code: promo.code,
        backgroundImage: promo.backgroundImage,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        usageLimit: promo.usageLimit || 0,
        isActive: promo.isActive,
        startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : '',
        endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : '',
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(initialFormData);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("Ảnh không được vượt quá 2MB.");
        return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (!response.ok) throw new Error("Tải ảnh lên thất bại.");
        const data = await response.json();
        setFormData(prev => ({...prev, backgroundImage: data.url}));
        toast.success("Tải ảnh lên thành công!");
    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const apiData = {
        ...formData,
        usageLimit: Number(formData.usageLimit) || null,
        discountValue: Number(formData.discountValue),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    };

    const url = isEditing ? `/api/admin/promotions/${formData.id}` : '/api/admin/promotions';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(apiData) });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Thao tác thất bại");
      }
      toast.success(isEditing ? 'Cập nhật thành công!' : 'Thêm mã giảm giá thành công!');
      handleCancelEdit();
      await fetchPromotions();
      await fetchLogs();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Xóa thất bại");
      toast.success('Xóa thành công!');
      await fetchPromotions();
      await fetchLogs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  
  const handleToggleActive = async (promo: Promotion) => {
    try {
        const res = await fetch(`/api/admin/promotions/${promo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !promo.isActive }),
        });
        if (!res.ok) throw new Error("Thay đổi trạng thái thất bại");
        toast.success("Thay đổi trạng thái thành công!");
        await fetchPromotions();
        await fetchLogs();
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

  function renderPromotionLogDetail(log: UILog) {
    try {
      const detail = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : log.details;
      const changes = detail.changes || detail;
      if (!changes) return `Hành động: ${log.action.toLowerCase()}`;
      
      const before = changes.before || {};
      const after = changes.after || changes;

      if (log.action === 'CREATE') return `Tạo mã: ${after.code}`;
      if (log.action === 'DELETE') return `Xóa mã: ${before.code || detail.code}`;
      if (log.action === 'UPDATE') {
        if ('isActive' in after && before.isActive !== after.isActive) {
            return `Mã ${after.code || before.code}: ${after.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'}`;
        }
        return `Cập nhật mã: ${after.code || before.code}`;
      }
      return '---';
    } catch (e) {
      return 'Lỗi dữ liệu log.';
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-gray-50/50">
      {/* Left Column: Form & Logs */}
      <div className="w-1/3 flex flex-col p-4 space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">{isEditing ? 'Chỉnh sửa mã' : 'Thêm mã giảm giá'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="code" value={formData.code} onChange={handleInputChange} placeholder="Mã giảm giá (VD: SALE50)" required className="w-full px-3 py-2 border rounded-md" aria-label="Mã giảm giá"/>
            <select name="discountType" value={formData.discountType} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md" aria-label="Loại giảm giá">
                <option value="FIXED_AMOUNT">Giá cố định</option>
                <option value="PERCENTAGE">Phần trăm</option>
            </select>
            <input name="discountValue" type="number" value={formData.discountValue} onChange={handleInputChange} placeholder="Giá trị" required className="w-full px-3 py-2 border rounded-md" aria-label="Giá trị giảm giá"/>
            <input name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" aria-label="Ngày bắt đầu"/>
            <input name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" aria-label="Ngày kết thúc"/>
            <input name="usageLimit" type="number" value={formData.usageLimit} onChange={handleInputChange} placeholder="Số lần sử dụng tối đa" className="w-full px-3 py-2 border rounded-md" aria-label="Giới hạn sử dụng"/>
            
            <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input name="isActive" type="checkbox" checked={formData.isActive} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"/> Kích hoạt
                </label>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 border rounded-md flex items-center justify-center bg-gray-50">
                        {formData.backgroundImage ? <Image src={formData.backgroundImage} alt="Ảnh" width={40} height={40} className="object-contain" loading="eager" priority /> : <span className="text-xs text-gray-400">Ảnh</span>}
                    </div>
                    <label htmlFor="promo-image-upload" className="bg-pink-100 text-pink-700 font-semibold py-2 px-3 rounded-md hover:bg-pink-200 transition text-sm flex items-center gap-1 cursor-pointer">
                        <UploadCloud size={14}/>
                        {uploading ? '...' : 'Tải ảnh'}
                    </label>
                    <input id="promo-image-upload" ref={fileInputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button type="submit" disabled={submitting || uploading} className="flex-grow bg-pink-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-pink-600 transition disabled:bg-gray-400">
                {submitting ? 'Đang xử lý...' : isEditing ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
              {isEditing && ( <button type="button" onClick={handleCancelEdit} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition">Hủy</button> )}
            </div>
          </form>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-grow flex flex-col min-h-0">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Lịch sử thao tác</h3>
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
            <div className="flex-grow overflow-y-auto">
                {loadingLogs ? <p>Đang tải...</p> : (
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="p-2 text-left font-semibold text-gray-600">Thời gian</th>
                        <th className="p-2 text-left font-semibold text-gray-600">Người dùng</th>
                        <th className="p-2 text-left font-semibold text-gray-600">Chi tiết</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {filteredLogs.length > 0 ? filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-2 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-2 whitespace-nowrap text-gray-500">{log.admin?.email || 'Hệ thống'}</td>
                        <td className="p-2 text-gray-600">{renderPromotionLogDetail(log)}</td>
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

      {/* Right Column: Promotions List */}
      <div className="w-2/3 flex-grow p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto">
          {loading ? <p className="p-4">Đang tải...</p> : (
            <table className="min-w-full">
              <thead className="bg-pink-100 sticky top-0">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Ảnh</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Loại</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Giá trị</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Hiệu lực</th>
                  <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase">Đã dùng</th>
                  <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase">Trạng thái</th>
                  <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promotions.map(promo => (
                  <tr key={promo.id} className="hover:bg-pink-50/50">
                    <td className="p-2">
                      <div className="flex items-center justify-center">
                        {promo.backgroundImage ? (
                          <Image
                            src={promo.backgroundImage}
                            alt={promo.code}
                            width={40}
                            height={40}
                            className="object-contain rounded-md"
                            loading="lazy"
                            style={{ width: 'auto', height: 'auto', maxWidth: 40, maxHeight: 40 }}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3 font-medium">{promo.code}</td>
                    <td className="p-3">{promotionTypes[promo.discountType]}</td>
                    <td className="p-3">{promo.discountValue.toLocaleString()} {promo.discountType === 'PERCENTAGE' ? '%' : 'VND'}</td>
                    <td className="p-3">{promo.startDate ? new Date(promo.startDate).toLocaleDateString() : 'N/A'} - {promo.endDate ? new Date(promo.endDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-3 text-center">{promo.timesUsed} / {promo.usageLimit || '∞'}</td>
                    <td className="p-3 text-center"><span onClick={() => handleToggleActive(promo)} className={`cursor-pointer px-2 py-1 text-xs rounded-full ${promo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{promo.isActive ? 'Kích hoạt' : 'Vô hiệu'}</span></td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleEdit(promo)} className="text-blue-500 hover:text-blue-700 p-1" aria-label="Sửa mã giảm giá"><Pencil size={16}/></button>
                      <button onClick={() => handleDelete(promo.id)} className="text-red-500 hover:text-red-700 p-1" aria-label="Xóa mã giảm giá"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 