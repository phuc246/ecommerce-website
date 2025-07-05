"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { PlusIcon, X, Image as ImageIcon } from "lucide-react";
import ImageCropper, { AspectRatioOption } from '@/components/ImageCropper';
import ProductForm from '@/components/admin/ProductForm';

// Types
interface Category { id: string; name: string; parentId?: string; }
interface Trend { id: string; name: string; }
interface Attribute { id: string; name: string; }

interface Variant {
  id: string;
  color: string;
  colorHex: string;
  sizes: { size: string; stock: number }[];
  price: string;
  salePrice: string;
  sku: string;
  image: string | null;
  imageFile: File | null;
}
type SizeType = 'Áo' | 'Quần' | 'Đầm / Váy' | 'Giày / Dép';

type CroppingTarget = {
    type: 'main' | 'additional' | 'variant';
    id?: string; // For variant: variant.id. For additional: a temp id.
};

// Helper to convert data URL to File
function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const SIZING_PRESETS = {
  'Áo': ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Oversize", "Free size"],
  'Quần': ["26", "27", "28", "29", "30", "31", "32", "34", "36", "38"],
  'Đầm / Váy': ["XS", "S", "M", "L", "XL", "2XL", "Oversize", "Free size"],
  'Giày / Dép': ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
};

const imageAspectRatioOptions: AspectRatioOption[] = [
    { value: '1', label: 'Vuông (1:1)' },
    { value: '0.75', label: 'Đứng (3:4)' },
    { value: '1.333', label: 'Ngang (4:3)' },
    { value: '1.777', label: 'Rộng (16:9)' },
];

function buildCategoryBreadcrumbOptions(categories: Category[]): { id: string; label: string; }[] {
  // Xây map id -> category
  const map = new Map(categories.map(c => [c.id, c]));
  // Tìm tất cả danh mục lá
  const isLeaf = (cat: Category) => !categories.some(c => c.parentId === cat.id);
  const leaves = categories.filter(isLeaf);
  // Hàm lấy label breadcrumb
  function getLabel(cat: Category): string {
    let label = cat.name;
    let current: Category | undefined = cat;
    while (current && current.parentId && map.has(current.parentId)) {
      current = map.get(current.parentId);
      if (!current) break;
      label = current.name + ' > ' + label;
    }
    return label;
  }
  return leaves.map(cat => ({ id: cat.id, label: getLabel(cat) }));
}

// Thêm helper format tiền
function formatCurrencyInput(value: string) {
  const numeric = value.replace(/\D/g, "");
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, trendRes, attrRes] = await Promise.all([
          fetch("/api/categories"), fetch("/api/trends"), fetch("/api/admin/attributes")
        ]);
        setCategories(await catRes.json());
        setTrends(await trendRes.json());
        setAttributes(await attrRes.json());
      } catch (error) { toast.error("Không thể tải dữ liệu cần thiết."); }
    };
    fetchData();
  }, []);

  const handleAdd = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Thêm sản phẩm thất bại.');
      toast.success('Thêm sản phẩm thành công!');
      router.push('/admin/products');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50/50">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thêm sản phẩm mới</h1>
      <ProductForm
        mode="add"
        onSubmit={handleAdd}
        categories={categories}
        trends={trends}
        attributes={attributes}
        loading={loading}
      />
    </div>
  );
}