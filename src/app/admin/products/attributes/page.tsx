"use client";

import { useState, useEffect } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Attribute {
  id: string;
  name: string;
}

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttribute, setNewAttribute] = useState("");
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const response = await fetch("/api/admin/attributes");
      if (!response.ok) throw new Error("Failed to fetch attributes");
      const data = await response.json();
      setAttributes(data);
    } catch (error) {
      console.error("Error fetching attributes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttribute.trim()) return;

    try {
      const response = await fetch("/api/admin/attributes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newAttribute }),
      });

      if (!response.ok) throw new Error("Failed to create attribute");
      
      const data = await response.json();
      setAttributes([data, ...attributes]);
      setNewAttribute("");
    } catch (error) {
      console.error("Error creating attribute:", error);
    }
  };

  const handleUpdate = async (attribute: Attribute) => {
    try {
      const response = await fetch("/api/admin/attributes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attribute),
      });

      if (!response.ok) throw new Error("Failed to update attribute");
      
      const updatedAttribute = await response.json();
      setAttributes(attributes.map(attr => 
        attr.id === updatedAttribute.id ? updatedAttribute : attr
      ));
      setEditingAttribute(null);
    } catch (error) {
      console.error("Error updating attribute:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attribute?")) return;

    try {
      const response = await fetch(`/api/admin/attributes?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete attribute");
      
      setAttributes(attributes.filter(attr => attr.id !== id));
    } catch (error) {
      console.error("Error deleting attribute:", error);
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
      <h1 className="text-2xl font-semibold mb-6">Quản lý thuộc tính sản phẩm</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="newAttribute" className="sr-only">
              Tên thuộc tính mới
            </label>
            <input
              id="newAttribute"
              type="text"
              value={newAttribute}
              onChange={(e) => setNewAttribute(e.target.value)}
              placeholder="Nhập tên thuộc tính mới"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Thêm thuộc tính
          </button>
        </div>
      </form>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên thuộc tính
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attributes.map((attribute) => (
              <tr key={attribute.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingAttribute?.id === attribute.id ? (
                    <input
                      type="text"
                      value={editingAttribute.name}
                      onChange={(e) =>
                        setEditingAttribute({
                          ...editingAttribute,
                          name: e.target.value,
                        })
                      }
                      onBlur={() => handleUpdate(editingAttribute)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      autoFocus
                      aria-label="Edit attribute name"
                    />
                  ) : (
                    <span className="text-gray-900">{attribute.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingAttribute(attribute)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    title="Edit attribute"
                  >
                    <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Edit attribute</span>
                  </button>
                  <button
                    onClick={() => handleDelete(attribute.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete attribute"
                  >
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Delete attribute</span>
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