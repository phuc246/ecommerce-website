"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [initialData, setInitialData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [productRes, catRes, attrRes] = await Promise.all([
          fetch(`/api/products/${params.id}`),
          fetch("/api/categories"),
          fetch("/api/admin/attributes")
        ]);
        if (!productRes.ok) throw new Error("Không tìm thấy sản phẩm");
        setInitialData(await productRes.json());
        setCategories(await catRes.json());
        setAttributes(await attrRes.json());
      } catch {
        toast.error("Không thể tải dữ liệu để chỉnh sửa!");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      let errorMsg = '';
      if (!res.ok) {
        try {
          const err = await res.json();
          errorMsg = err?.error || 'Cập nhật sản phẩm thất bại.';
        } catch {
          errorMsg = 'Cập nhật sản phẩm thất bại.';
        }
        toast.error(errorMsg);
        return;
      }
      toast.success('Cập nhật sản phẩm thành công!');
      router.push('/admin/products');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50/50">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Chỉnh sửa sản phẩm</h1>
      {loading ? (
        <div className="text-center py-12">Đang tải dữ liệu sản phẩm...</div>
      ) : (
        <ProductForm
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
          categories={categories}
          attributes={attributes}
          loading={loading}
        />
      )}
    </div>
  );
} 