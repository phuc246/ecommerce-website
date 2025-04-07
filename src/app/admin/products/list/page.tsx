"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import ProductTable from "@/components/admin/ProductTable";
import AddProductModal from "@/components/admin/AddProductModal";

export default function ProductList() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Danh sách sản phẩm</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Thêm sản phẩm
        </button>
      </div>

      <ProductTable />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
} 