"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { useLogo } from '@/hooks/useLogo';
import { Log } from '@prisma/client';
import { UploadCloud, RefreshCw } from 'lucide-react';
const ImageCropper = dynamic(() => import('@/components/ImageCropper'), { ssr: false });

interface UILog extends Log {
  admin?: { email?: string | null } | null;
}

export default function AdminLogoPage() {
  const { url: logoUrl, isCircular: initialIsCircular, isLoading: logoLoading, refresh: refreshLogoHook } = useLogo();
  const [isCircular, setIsCircular] = useState(initialIsCircular);
  const [logs, setLogs] = useState<UILog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logFromDate, setLogFromDate] = useState("");
  const [logToDate, setLogToDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch("/api/admin/logs?entity=logo");
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      toast.error("Không thể tải lịch sử thao tác.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    setIsCircular(initialIsCircular);
  }, [initialIsCircular]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
      toast.error("Hình ảnh quá lớn. Vui lòng chọn hình có kích thước nhỏ hơn 5MB.");
        return;
      }
      const reader = new FileReader();
    reader.onload = (ev) => {
      setRawImage(ev.target?.result as string);
      setCropperOpen(true);
    };
      reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropDone = async (croppedImage: string, shape: 'rect' | 'circle') => {
    setCropperOpen(false);
    setUploading(true);
    const isCircular = shape === 'circle';
    try {
      // 1. Upload ảnh lên Cloudinary
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: croppedImage, destination: 'logo' }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.url) throw new Error('Lỗi upload ảnh lên Cloudinary');
      // 2. Lưu URL vào DB
      const response = await fetch('/api/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadData.url, isCircular }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Cập nhật logo thất bại.");
      toast.success('Logo đã được cập nhật thành công!');
      await refreshLogoHook();
      await fetchLogs();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setUploading(false);
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
  
  function renderLogDetail(log: UILog) {
    return `Cập nhật logo mới.`;
  }

  if (logoLoading) return <div className="p-6">Đang tải thông tin logo...</div>;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-gray-50/50">
       {cropperOpen && rawImage && (
        <ImageCropper 
          image={rawImage} 
          onCropDone={handleCropDone} 
          onCancel={() => setCropperOpen(false)}
          aspectRatioOptions={[
            { value: '1.91', label: 'Tự do' },
            { value: 'circle', label: 'Tròn' },
            { value: '1', label: 'Vuông (1:1)' },
            { value: '0.75', label: 'Đứng (3:4)' },
            { value: '1.333', label: 'Ngang (4:3)' },
            { value: '1.777', label: 'Rộng (16:9)' },
          ]}
        />
      )}
      {/* Left Column */}
      <div className="w-1/3 flex flex-col p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-grow flex flex-col">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Quản lý logo</h2>
          
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-md font-medium text-gray-700">Logo hiện tại</h3>
            <button
              onClick={refreshLogoHook}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              disabled={uploading}
            >
              <RefreshCw size={14} className={uploading ? 'animate-spin' : ''}/>
              Làm mới
            </button>
          </div>
          <div className="border border-dashed border-gray-300 rounded-md p-4 flex items-center justify-center bg-gray-50 h-48 flex-grow mb-6">
            {logoUrl ? <Image src={logoUrl} alt="Current Logo" width={150} height={150} className={`object-contain ${isCircular ? 'rounded-full' : ''}`} priority /> : <p>Chưa có logo</p>}
          </div>

          <h3 className="text-md font-medium text-gray-700 mb-2">Tải lên logo mới</h3>
          <p className="text-xs text-gray-500 mb-4">Chọn ảnh PNG, JPG, WEBP (tối đa 5MB).</p>
           <button 
              onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 bg-pink-500 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-pink-600 transition disabled:bg-gray-400"
            >
                <UploadCloud size={18}/>
                {uploading ? 'Đang tải lên...' : 'Chọn ảnh'}
            </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileChange}
                aria-label="Chọn ảnh để tải lên"
              />
            </div>
          </div>
      {/* Right Column */}
      <div className="w-2/3 flex-grow p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
           <div className="p-4 border-b">
                <h3 className="text-lg font-bold text-gray-800">Lịch sử thao tác</h3>
                <div className="flex flex-wrap gap-4 mt-4 items-center text-sm">
                    <div className="flex flex-col gap-1.5 flex-grow">
                      <label htmlFor="logUserFilter" className="font-medium text-gray-600">Lọc theo email</label>
                      <input id="logUserFilter" type="text" placeholder="Nhập email..." value={logUserFilter} onChange={(e) => setLogUserFilter(e.target.value)} className="border px-2 py-1.5 rounded-md"/>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="logFromDate" className="font-medium text-gray-600">Từ ngày</label>
                      <input id="logFromDate" type="date" value={logFromDate} onChange={(e) => setLogFromDate(e.target.value)} className="border px-2 py-1.5 rounded-md"/>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="logToDate" className="font-medium text-gray-600">Đến ngày</label>
                      <input id="logToDate" type="date" value={logToDate} onChange={(e) => setLogToDate(e.target.value)} className="border px-2 py-1.5 rounded-md"/>
                    </div>
      </div>
        </div>
           <div className="flex-grow overflow-y-auto">
             {loadingLogs ? <p className="p-4">Đang tải lịch sử...</p> : (
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
                      <td className="p-2 whitespace-nowrap text-gray-500">{log.userEmail || 'Hệ thống'}</td>
                      <td className="p-2 whitespace-nowrap text-gray-600">{renderLogDetail(log)}</td>
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