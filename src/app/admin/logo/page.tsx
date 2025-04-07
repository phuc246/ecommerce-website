"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface LogoData {
  key: string;
  value: string;
}

export default function LogoPage() {
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isCircular, setIsCircular] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const response = await fetch("/api/admin/logo");
      if (!response.ok) throw new Error("Failed to fetch logo");
      const data = await response.json();
      setLogo(data);
      if (data?.value) {
        setPreview(data.value);
      }
    } catch (error) {
      console.error("Error fetching logo:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Hình ảnh quá lớn. Vui lòng chọn hình có kích thước nhỏ hơn 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        // Reset error state when a new image is uploaded
        setPreviewError(false);
        setMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageError = () => {
    console.log("Error loading image");
    setHasError(true);
  };

  const handlePreviewError = () => {
    console.log("Error loading preview image");
    setPreviewError(true);
    setMessage("Không thể hiển thị hình ảnh xem trước. Vui lòng thử lại với hình ảnh khác.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview || previewError) return;

    try {
      setUploading(true);
      setMessage(null);
      
      // In a real application, you would upload the image to a storage service
      // and get a URL back. For now, we'll just use the data URL.
      const imageUrl = preview;
      
      const response = await fetch("/api/admin/logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          imageUrl,
          isCircular
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        let errorMessage = "Failed to update logo";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // Xử lý trường hợp response không phải JSON
          const text = await response.text();
          console.error("Response is not JSON:", text);
          if (text.includes("<!DOCTYPE")) {
            errorMessage = "Lỗi server: Không thể kết nối đến API. Vui lòng đăng nhập lại.";
          }
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setLogo(data);
      setHasError(false);
      setMessage("Logo đã được cập nhật thành công! Logo sẽ hiển thị ở góc phải trên thanh điều hướng.");
    } catch (error) {
      console.error("Error updating logo:", error);
      setMessage(`Lỗi khi cập nhật logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Quản lý logo</h1>
      
      <div className="max-w-xl bg-white p-6 rounded-lg shadow">
        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes('thành công') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Logo hiện tại</h2>
          <p className="text-sm text-gray-500 mb-4">
            Logo sẽ hiển thị ở phía bên phải của thanh điều hướng, cạnh giỏ hàng.
          </p>
          <div className="border border-gray-200 rounded-md p-4 flex items-center justify-center bg-gray-50 h-40">
            {logo?.value && !hasError ? (
              <div className={`relative h-32 w-32 ${isCircular ? 'rounded-full overflow-hidden' : ''}`}>
                <Image 
                  src={logo.value} 
                  alt="Current Logo" 
                  fill
                  style={{ objectFit: 'cover' }}
                  onError={handleImageError}
                  sizes="128px"
                  className={isCircular ? 'rounded-full' : ''}
                />
              </div>
            ) : (
              <p className="text-gray-500">{hasError ? "Lỗi khi hiển thị logo" : "Chưa có logo"}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Tải lên logo mới</h2>
            <p className="text-sm text-gray-500 mb-4">
              Chọn hình ảnh có kích thước nhỏ (tối đa 5MB). Định dạng hỗ trợ: PNG, JPG, WEBP.
            </p>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isCircular}
                  onChange={() => setIsCircular(!isCircular)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 mr-2"
                />
                <span className="text-sm text-gray-700">Hiển thị logo dạng hình tròn</span>
              </label>
            </div>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors h-40"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview && preview !== logo?.value && !previewError ? (
                <div className={`relative h-32 w-32 ${isCircular ? 'rounded-full overflow-hidden' : ''}`}>
                  <Image 
                    src={preview} 
                    alt="Logo Preview" 
                    fill
                    style={{ objectFit: 'cover' }}
                    onError={handlePreviewError}
                    sizes="128px"
                    className={isCircular ? 'rounded-full' : ''}
                  />
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    {previewError ? "Lỗi tải hình ảnh, vui lòng thử lại" : "Click để chọn hoặc kéo thả file vào đây"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</p>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp"
                aria-label="Upload logo image"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !preview || preview === logo?.value || previewError}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              uploading || !preview || preview === logo?.value || previewError
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {uploading ? "Đang xử lý..." : "Cập nhật logo"}
          </button>
        </form>
      </div>
    </div>
  );
} 