"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface LogoData {
  key: string;
  value: string;
  isCircular?: boolean;
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
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      const response = await fetch("/api/admin/logo", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
        next: { revalidate: 0 },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logo: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched logo data:", data);
      
      if (data) {
        setLogo(data);
        setIsCircular(data.isCircular || true);
        
        // Only set preview if we have a valid value
        if (data?.value && typeof data.value === 'string' && data.value.trim() !== '') {
          // Don't add timestamp to data URLs
          if (data.value.startsWith('data:image/')) {
            setPreview(data.value);
          } else {
            // Add timestamp to prevent caching for regular URLs
            const logoUrl = `${data.value}?t=${Date.now()}`;
            setPreview(logoUrl);
          }
        } else {
          setPreview(null);
        }
      } else {
        setLogo(null);
        setPreview(null);
      }
    } catch (error) {
      console.error("Error fetching logo:", error);
      setHasError(true);
      setMessage("Không thể tải thông tin logo từ máy chủ. Vui lòng thử lại sau.");
      setLogo(null);
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Hình ảnh quá lớn. Vui lòng chọn hình có kích thước nhỏ hơn 5MB.");
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setMessage("Định dạng file không hợp lệ. Vui lòng chọn hình ảnh PNG, JPG hoặc WEBP.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const result = reader.result as string;
          // Validate the data URL format
          if (typeof result === 'string' && result.startsWith('data:image/')) {
            setPreview(result);
            // Reset error state when a new image is uploaded
            setPreviewError(false);
            setMessage(null);
          } else {
            throw new Error("Invalid image format");
          }
        } catch (error) {
          console.error("Error processing image:", error);
          setPreviewError(true);
          setMessage("Không thể xử lý hình ảnh. Vui lòng thử lại với hình ảnh khác.");
        }
      };
      
      reader.onerror = () => {
        console.error("FileReader error:", reader.error);
        setPreviewError(true);
        setMessage("Lỗi khi đọc file. Vui lòng thử lại.");
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

  const handleRefreshLogo = async () => {
    try {
      setRefreshing(true);
      setMessage(null);

      // Force an update of browser cache by invalidating it
      const response = await fetch("/api/admin/refresh-logo", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to refresh logo");
      }

      // Fetch the logo again
      await fetchLogo();
      setMessage("Logo đã được làm mới. Bạn có thể cần phải tải lại trang để thấy thay đổi.");
    } catch (error) {
      console.error("Error refreshing logo:", error);
      setMessage(`Lỗi khi làm mới logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview || previewError) return;

    try {
      setUploading(true);
      setMessage(null);
      
      // Ensure the image URL is valid
      if (!preview.startsWith('data:image/')) {
        throw new Error("Invalid image format");
      }
      
      const imageUrl = preview;
      
      const response = await fetch("/api/admin/logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
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
          // Handle non-JSON response
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
      setMessage("Logo đã được cập nhật thành công! Vui lòng nhấn nút 'Làm mới logo' để hiển thị logo mới trên thanh điều hướng.");
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium">Logo hiện tại</h2>
            <button
              type="button"
              onClick={handleRefreshLogo}
              disabled={refreshing}
              className={`text-sm px-3 py-1 rounded ${
                refreshing 
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }`}
            >
              {refreshing ? "Đang làm mới..." : "Làm mới logo"}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Logo sẽ hiển thị ở thanh điều hướng phía trên cùng. Nhấn "Làm mới logo" nếu bạn không thấy logo mới.
          </p>
          <div className="border border-gray-200 rounded-md p-4 flex items-center justify-center bg-gray-50 h-40">
            {logo?.value && !hasError ? (
              <div className={`relative h-32 w-32 ${isCircular ? 'rounded-full overflow-hidden' : ''}`}>
                <Image 
                  src={logo.value.startsWith('data:image/') 
                    ? logo.value  // Don't add timestamp to data URLs
                    : `${logo.value}?t=${Date.now()}`} 
                  alt="Current Logo" 
                  fill
                  style={{ objectFit: 'cover' }}
                  onError={handleImageError}
                  sizes="128px"
                  className={isCircular ? 'rounded-full' : ''}
                  unoptimized={true}
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
                  {preview.startsWith('data:image/') ? (
                    <Image 
                      src={preview} 
                      alt="Logo Preview" 
                      fill
                      style={{ objectFit: 'cover' }}
                      onError={(e) => {
                        console.error("Error loading preview image");
                        setPreviewError(true);
                        setMessage("Không thể hiển thị hình ảnh xem trước. Vui lòng thử lại với hình ảnh khác.");
                      }}
                      sizes="128px"
                      className={isCircular ? 'rounded-full' : ''}
                      unoptimized={true}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-gray-200">
                      <p className="text-sm text-red-500">Invalid image format</p>
                    </div>
                  )}
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
            disabled={uploading || !preview || (preview === logo?.value) || previewError}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              uploading || !preview || (preview === logo?.value) || previewError
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