"use client";

import { useState, useEffect } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { toast } from "react-hot-toast";
import EditProductModal from "./EditProductModal";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  category: {
    id: string;
    name: string;
  };
  colors: Array<{
    id: string;
    name: string;
    value: string;
  }>;
  sizes: Array<{
    id: string;
    name: string;
  }>;
  attributes: Array<{
    id: string;
    name: string;
  }>;
}

export default function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      const response = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete product");

      toast.success("Xóa sản phẩm thành công");
      fetchProducts();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Không thể xóa sản phẩm");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Hình ảnh
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Tên sản phẩm
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Danh mục
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Giá
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Kho
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Màu sắc
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Kích thước
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Thuộc tính
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-0">
                      <div className="h-16 w-16 relative">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-900">
                      {product.category.name}
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-900">
                      {product.stock}
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {product.colors.map((color) => (
                          <div
                            key={color.id}
                            className="h-6 w-6 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-900">
                      <div className="flex gap-1">
                        {product.sizes.map((size) => (
                          <span
                            key={size.id}
                            className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                          >
                            {size.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {product.attributes.map((attr) => (
                          <span
                            key={attr.id}
                            className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                          >
                            {attr.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Chỉnh sửa"
                        >
                          <PencilIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {editingProduct && (
        <EditProductModal
          isOpen={!!editingProduct}
          onClose={() => {
            setEditingProduct(null);
            fetchProducts();
          }}
          product={editingProduct}
        />
      )}
    </div>
  );
} 