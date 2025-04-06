"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";

export default function AddProduct() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    stock: "",
    color: "",
    size: "",
    image: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast.error("Không thể tải danh mục");
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
      setFormData((prev) => ({ ...prev, image: data.url }));
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
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Thêm sản phẩm thất bại");
      }

      toast.success("Thêm sản phẩm thành công");
      router.push("/admin/products");
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      toast.error(error instanceof Error ? error.message : "Thêm sản phẩm thất bại");
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
      <h1 className="text-2xl font-bold mb-6">Thêm sản phẩm mới</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh sản phẩm
              </label>
              <div className="space-y-4">
                {formData.image && (
                  <div className="relative w-32 h-32">
                    <Image
                      src={formData.image}
                      alt="Preview"
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
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
                  title="Chọn ảnh sản phẩm"
                  aria-label="Chọn ảnh sản phẩm"
                />
                <p className="text-sm text-gray-500">
                  Hình ảnh tỷ lệ 1:1, tối đa 2MB
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Nhập tên sản phẩm"
                  aria-label="Tên sản phẩm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại sản phẩm
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  aria-label="Loại sản phẩm"
                >
                  <option value="">Chọn loại sản phẩm</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Màu sắc
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Nhập màu sắc"
                  aria-label="Màu sắc"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, size: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Nhập size"
                  aria-label="Size"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả sản phẩm
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
              placeholder="Nhập mô tả sản phẩm"
              aria-label="Mô tả sản phẩm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá sản phẩm
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
                placeholder="Nhập giá sản phẩm"
                aria-label="Giá sản phẩm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, stock: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                placeholder="Nhập số lượng"
                aria-label="Số lượng"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Đang thêm..." : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 