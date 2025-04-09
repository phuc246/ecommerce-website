"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  image: string | null;
  productCount: number;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    image: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Không thể tải danh mục");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa là 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/your-cloud-name/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      setFormData((prev) => ({ ...prev, image: data.secure_url }));
      setImagePreview(data.secure_url);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Không thể tải lên ảnh");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for adding or editing
  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        image: category.image || "",
      });
      setImagePreview(category.image);
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        image: "",
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      image: "",
    });
    setImagePreview(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        editingCategory
          ? `/api/categories?id=${editingCategory.id}`
          : "/api/categories",
        {
          method: editingCategory ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Có lỗi xảy ra");
      }

      const newCategory = await response.json();

      if (editingCategory) {
        setCategories(
          categories.map((cat) =>
            cat.id === editingCategory.id ? { ...newCategory, productCount: cat.productCount } : cat
          )
        );
        toast.success("Đã cập nhật danh mục");
      } else {
        setCategories([...categories, { ...newCategory, productCount: 0 }]);
        toast.success("Đã thêm danh mục mới");
      }

      closeModal();
    } catch (error) {
      console.error("Error submitting category:", error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle category deletion
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Không thể xóa danh mục");
      }

      setCategories(categories.filter((cat) => cat.id !== id));
      toast.success("Đã xóa danh mục");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error instanceof Error ? error.message : "Không thể xóa danh mục");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="mt-2 text-sm text-gray-700">
            Quản lý các danh mục sản phẩm trong cửa hàng của bạn
          </p>
        </div>
        <button
          type="button"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => openModal()}
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Thêm danh mục
        </button>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {categories.length > 0 ? (
            categories.map((category) => (
              <li key={category.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {category.image ? (
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={category.image}
                            alt={category.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-500 text-lg">
                            {category.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {category.productCount} sản phẩm
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => openModal(category)}
                      >
                        <PencilIcon className="-ml-1 mr-1 h-4 w-4" aria-hidden="true" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={() => handleDelete(category.id)}
                        disabled={category.productCount > 0}
                        title={
                          category.productCount > 0
                            ? "Không thể xóa danh mục có sản phẩm"
                            : "Xóa danh mục"
                        }
                      >
                        <TrashIcon className="-ml-1 mr-1 h-4 w-4 text-red-500" aria-hidden="true" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có danh mục nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                Bắt đầu bằng cách tạo danh mục đầu tiên cho cửa hàng của bạn.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => openModal()}
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Thêm danh mục
                </button>
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6 shadow-xl">
            <div className="absolute top-4 right-4">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={closeModal}
                title="Đóng"
                aria-label="Đóng"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Hình ảnh (tùy chọn)
                </label>
                <div className="mt-1 flex items-center">
                  {imagePreview ? (
                    <div className="relative h-32 w-32 rounded-lg overflow-hidden bg-gray-100 mr-4">
                      <Image
                        src={imagePreview}
                        alt="Category preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-white rounded-full p-1"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData((prev) => ({ ...prev, image: "" }));
                        }}
                        title="Xóa ảnh"
                        aria-label="Xóa ảnh"
                      >
                        <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-32 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center mr-4">
                      {uploadingImage ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                      ) : (
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div className="flex-grow">
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {uploadingImage ? "Đang tải lên..." : "Tải lên ảnh"}
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={submitting || !formData.name}
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    <span>{editingCategory ? "Cập nhật" : "Tạo mới"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 