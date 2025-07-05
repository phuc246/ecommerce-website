"use client";

import { useState, useEffect } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Category {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategory }),
      });

      if (!response.ok) throw new Error("Failed to create category");
      
      const data = await response.json();
      setCategories([data, ...categories]);
      setNewCategory("");
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleUpdate = async (category: Category) => {
    try {
      const response = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) throw new Error("Failed to update category");
      
      const updatedCategory = await response.json();
      setCategories(categories.map(cat => 
        cat.id === updatedCategory.id ? updatedCategory : cat
      ));
      setEditingCategory(null);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");
      
      setCategories(categories.filter(cat => cat.id !== id));
    } catch (error) {
      console.error("Error deleting category:", error);
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
      <h1 className="text-2xl font-semibold mb-6">Quản lý danh mục sản phẩm</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="newCategory" className="sr-only">
              Tên danh mục mới
            </label>
            <input
              id="newCategory"
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nhập tên danh mục mới"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Thêm danh mục
          </button>
        </div>
      </form>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên danh mục
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingCategory?.id === category.id ? (
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                        })
                      }
                      onBlur={() => handleUpdate(editingCategory)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      autoFocus
                      aria-label="Edit category name"
                    />
                  ) : (
                    <span className="text-gray-900">{category.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    title="Edit category"
                  >
                    <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Edit category</span>
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete category"
                  >
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Delete category</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 