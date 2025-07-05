"use client";

import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { FooterData, FooterColumn } from "@/app/api/admin/footer/route";

export default function FooterPage() {
  const [footerData, setFooterData] = useState<FooterData>({
    columns: Array(5).fill(null).map((_, i) => ({
      title: `Column ${i + 1}`,
      links: []
    }))
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFooter();
  }, []);

  const fetchFooter = async () => {
    try {
      const response = await fetch("/api/admin/footer");
      if (!response.ok) throw new Error("Failed to fetch footer");
      const data = await response.json();
      
      if (data?.value) {
        try {
          const parsedData = JSON.parse(data.value);
          setFooterData(parsedData);
        } catch (e) {
          console.error("Error parsing footer data:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching footer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      
      const response = await fetch("/api/admin/footer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: JSON.stringify(footerData) }),
      });

      if (!response.ok) throw new Error("Failed to update footer");
      
      alert("Footer updated successfully!");
    } catch (error) {
      console.error("Error updating footer:", error);
      alert("Failed to update footer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateColumnTitle = (index: number, title: string) => {
    const updatedColumns = [...footerData.columns];
    updatedColumns[index] = {
      ...updatedColumns[index],
      title
    };
    setFooterData({
      ...footerData,
      columns: updatedColumns
    });
  };

  const addLink = (columnIndex: number) => {
    const updatedColumns = [...footerData.columns];
    updatedColumns[columnIndex] = {
      ...updatedColumns[columnIndex],
      links: [...updatedColumns[columnIndex].links, { text: "", url: "" }]
    };
    setFooterData({
      ...footerData,
      columns: updatedColumns
    });
  };

  const updateLink = (columnIndex: number, linkIndex: number, field: 'text' | 'url', value: string) => {
    const updatedColumns = [...footerData.columns];
    const updatedLinks = [...updatedColumns[columnIndex].links];
    updatedLinks[linkIndex] = {
      ...updatedLinks[linkIndex],
      [field]: value
    };
    updatedColumns[columnIndex] = {
      ...updatedColumns[columnIndex],
      links: updatedLinks
    };
    setFooterData({
      ...footerData,
      columns: updatedColumns
    });
  };

  const removeLink = (columnIndex: number, linkIndex: number) => {
    const updatedColumns = [...footerData.columns];
    const updatedLinks = [...updatedColumns[columnIndex].links];
    updatedLinks.splice(linkIndex, 1);
    updatedColumns[columnIndex] = {
      ...updatedColumns[columnIndex],
      links: updatedLinks
    };
    setFooterData({
      ...footerData,
      columns: updatedColumns
    });
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
      <h1 className="text-2xl font-semibold mb-6">Quản lý Footer</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4">Cấu trúc Footer (5 cột)</h2>
            <p className="text-sm text-gray-500 mb-6">
              Chỉnh sửa cấu trúc footer với 5 cột và thêm các liên kết vào từng cột.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {footerData.columns.map((column, columnIndex) => (
                <div key={columnIndex} className="border border-gray-200 rounded-md p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiêu đề cột {columnIndex + 1}
                    </label>
                    <input
                      type="text"
                      value={column.title}
                      onChange={(e) => updateColumnTitle(columnIndex, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Liên kết
                      </label>
                      <button
                        type="button"
                        onClick={() => addLink(columnIndex)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                        title="Thêm liên kết"
                      >
                        <PlusIcon className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Thêm liên kết</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {column.links.map((link, linkIndex) => (
                        <div key={linkIndex} className="bg-gray-50 p-3 rounded-md relative">
                          <button
                            type="button"
                            onClick={() => removeLink(columnIndex, linkIndex)}
                            className="absolute top-1 right-1 text-red-600 hover:text-red-800"
                            title="Xóa liên kết"
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Xóa liên kết</span>
                          </button>

                          <div className="mb-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nội dung hiển thị
                            </label>
                            <input
                              type="text"
                              value={link.text}
                              onChange={(e) => updateLink(columnIndex, linkIndex, 'text', e.target.value)}
                              placeholder="Văn bản hiển thị"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Link liên kết
                            </label>
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => updateLink(columnIndex, linkIndex, 'url', e.target.value)}
                              placeholder="https://example.com"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      ))}

                      {column.links.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          Chưa có liên kết nào. Bấm + để thêm.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium mb-4">Xem trước Footer</h2>
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {footerData.columns.map((column, columnIndex) => (
                  <div key={columnIndex}>
                    <h3 className="font-medium text-gray-900 mb-3">{column.title}</h3>
                    <ul className="space-y-2">
                      {column.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <a 
                            href={link.url} 
                            className="text-blue-600 hover:underline"
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {link.text || "Liên kết không có nội dung"}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={isSaving}
              className={`py-2 px-4 rounded-md font-medium ${
                isSaving
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 