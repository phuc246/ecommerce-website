"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";

export default function LogoManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [method, setMethod] = useState<"upload" | "url">("upload");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const response = await fetch("/api/logo");
      const data = await response.json();
      setLogoUrl(data.url);
    } catch (error) {
      toast.error("Không thể tải logo");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước file (tối đa 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File quá lớn. Vui lòng chọn file nhỏ hơn 2MB");
      return;
    }

    // Kiểm tra định dạng file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Tải lên thất bại");
      }

      const data = await response.json();
      setLogoUrl(data.url);
      toast.success("Tải lên thành công");
    } catch (error) {
      console.error("Lỗi khi tải lên:", error);
      toast.error(error instanceof Error ? error.message : "Tải lên thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: logoUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Cập nhật logo thất bại");
      }

      toast.success("Cập nhật logo thành công");
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      toast.error(error instanceof Error ? error.message : "Cập nhật logo thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Quản lý Logo</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Logo hiện tại</h2>
          {logoUrl && (
            <div className="relative w-32 h-32">
              <Image
                src={logoUrl}
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setMethod("upload")}
              className={`px-4 py-2 rounded-md ${
                method === "upload"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Tải lên file
            </button>
            <button
              onClick={() => setMethod("url")}
              className={`px-4 py-2 rounded-md ${
                method === "url"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Nhập URL
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {method === "upload" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tải lên logo mới
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  disabled={uploading}
                  title="Chọn file logo"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP) và kích thước tối đa 2MB
                </p>
                {uploading && (
                  <p className="mt-2 text-sm text-gray-500">Đang tải lên...</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Logo
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập URL logo mới"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Đang cập nhật..." : "Cập nhật Logo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 