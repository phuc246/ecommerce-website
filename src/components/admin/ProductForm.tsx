import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import ImageCropper, { AspectRatioOption } from '@/components/ImageCropper';
import Image from "next/image";
import toast from "react-hot-toast";
import { PlusIcon, X, Image as ImageIcon } from "lucide-react";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";

// Types
interface Category { id: string; name: string; parentId?: string; }
interface Trend { id: string; name: string; }
interface Attribute { id: string; name: string; }
interface Variant {
  id: string;
  color: string;
  sizes: { size: string; stock: number }[];
  price: string;
  salePrice: string;
  sku: string;
  image: string | null;
  imageFile: File | null;
}
type SizeType = 'Áo' | 'Quần' | 'Đầm / Váy' | 'Giày / Dép';
type CroppingTarget = { type: 'main' | 'additional' | 'variant'; id?: string; };

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

function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error('Invalid data URL');
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type:mime});
}

function formatCurrencyInput(value: any) {
  const str = (value ?? "").toString();
  const numeric = str.replace(/\D/g, "");
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  mode: 'add' | 'edit';
  categories: Category[];
  attributes: Attribute[];
  loading?: boolean;
}

export default function ProductForm({ initialData, onSubmit, mode, categories = [], attributes = [], loading }: ProductFormProps) {
  // Mapping lại variants nếu ở chế độ edit
  function mapVariantsForEdit(variantsRaw: any[]): Variant[] {
    if (!Array.isArray(variantsRaw)) return [];
    // Bỏ qua các variant thiếu trường bắt buộc
    const validVariants = variantsRaw.filter(v => v && v.color && v.size && v.price !== undefined);
    const map = new Map<string, Variant>();
    validVariants.forEach((v) => {
      const key = [v.color, v.sku, v.image].join("||");
      if (!map.has(key)) {
        map.set(key, {
          id: `variant_${Date.now()}_${Math.random()}`,
          color: v.color,
          sizes: [],
          price: v.price?.toString() ?? "",
          salePrice: v.salePrice?.toString() ?? "",
          sku: v.sku || "",
          image: v.image || null,
          imageFile: null,
        });
      }
      const variant = map.get(key)!;
      variant.sizes.push({ size: v.size, stock: v.stock });
    });
    return Array.from(map.values());
  }

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>(initialData?.categoryPath || []);
  const [selectedTrend, setSelectedTrend] = useState<string | null>(initialData?.trendId || null);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(initialData?.attributeIds || []);
  // Thay đổi state lưu ảnh
  const [mainImage, setMainImage] = useState<{ id?: string, url: string, file: File | null, altText?: string } | null>(initialData?.images?.find((img: any) => img.isMain) ? { ...initialData.images.find((img: any) => img.isMain), file: null } : null);
  const [additionalImages, setAdditionalImages] = useState<{ id?: string, url: string, file: File | null, altText?: string, order: number }[]>(
    initialData?.images
      ? initialData.images.filter((img: any) => !img.isMain).map((img: any, idx: number) => ({ ...img, file: null, order: img.order ?? idx + 1 }))
      : []
  );
  const [variants, setVariants] = useState<Variant[]>(
    initialData?.variants
      ? (mode === 'edit' ? mapVariantsForEdit(initialData.variants) : initialData.variants)
      : []
  );
  const [sizeType, setSizeType] = useState<SizeType | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [croppingTarget, setCroppingTarget] = useState<CroppingTarget | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setSelectedCategoryPath(initialData.categoryPath || []);
      setSelectedTrend(initialData.trendId || null);
      setSelectedAttributes(initialData.attributeIds || []);
      setMainImage(initialData.images?.find((img: any) => img.isMain) ? { ...initialData.images.find((img: any) => img.isMain), file: null } : null);
      setAdditionalImages(
        initialData.images
          ? initialData.images.filter((img: any) => !img.isMain).map((img: any, idx: number) => ({ ...img, file: null, order: img.order ?? idx + 1 }))
          : []
      );
      setVariants(
        initialData.variants
          ? (mode === 'edit' ? mapVariantsForEdit(initialData.variants) : initialData.variants)
          : []
      );
    }
  }, [initialData]);

  const handleFileTrigger = (target: CroppingTarget) => {
    setCroppingTarget(target);
    fileInputRef.current?.click();
  };

  // --- Sửa handleFileSelect để mở cropper thay vì upload trực tiếp ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Đọc file thành dataURL để crop
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropImage(ev.target?.result as string); // Mở cropper
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropDone = async (croppedDataUrl: string) => {
    if (!croppingTarget) return;
    const newFile = dataURLtoFile(croppedDataUrl, `cropped-${Date.now()}.png`);
    // Upload lên Cloudinary ngay khi crop xong
    const url = await uploadToCloudinary(newFile);
    if(croppingTarget.type === 'main') {
      setMainImage({ ...mainImage!, url, file: null }); // Lưu URL, không lưu file nữa
    } else if (croppingTarget.type === 'additional') {
      setAdditionalImages(prev => [...prev, { ...additionalImages[additionalImages.length - 1], url, file: null }].slice(0, 6));
    } else if (croppingTarget.type === 'variant' && croppingTarget.id) {
      handleVariantChange(croppingTarget.id, 'image', url);
      handleVariantChange(croppingTarget.id, 'imageFile', null);
    }
    setCropImage(null);
    setCroppingTarget(null);
  };

  const handleCropCancel = () => {
    setCropImage(null);
    setCroppingTarget(null);
  };

  const addVariant = (size = "") => {
    setVariants(prev => [
      ...prev,
      {
        id: `variant_${Date.now()}`,
        color: "",
        sizes: size ? [{ size, stock: 0 }] : [],
        price: "",
        salePrice: "",
        sku: "",
        image: null,
        imageFile: null,
      },
    ]);
  };
  const removeVariant = (id: string) => { setVariants(prev => prev.filter(v => v.id !== id)); };
  const handleVariantChange = (id: string, field: keyof Variant, value: any) => { setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v)); };
  const removeAdditionalImage = (id: string) => { setAdditionalImages(prev => prev.filter(img => img.id !== id)); };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("destination", "product"); // Đảm bảo upload vào folder 'product' trên Cloudinary
    const res = await fetch('/api/upload', { method: "POST", body: formData });
    if(!res.ok) throw new Error(`Failed to upload ${file.name}`);
    const data = await res.json();
    return data.url;
  }

  const moveAdditionalImage = (from: number, to: number) => {
    setAdditionalImages(prev => {
      if (to < 0 || to >= prev.length) return prev;
      const arr = [...prev];
      const [removed] = arr.splice(from, 1);
      arr.splice(to, 0, removed);
      return arr;
    });
  };

  function getChildren(parentId: string | null) {
    return categories.filter(c => (c.parentId ?? null) === parentId);
  }

  function renderCategorySelects() {
    const selects = [];
    let parentId: string | null = null;
    for (let level = 0; ; level++) {
      const options = getChildren(parentId);
      if (options.length === 0) break;
      const selected = selectedCategoryPath[level] || '';
      selects.push(
        <select
          key={level}
          value={selected}
          onChange={e => {
            const value = e.target.value;
            setSelectedCategoryPath(prev => {
              const next = prev.slice(0, level);
              if (value) next.push(value);
              return next;
            });
          }}
          className="w-full p-2 border rounded mb-2"
          required={level === 0}
          aria-label={level === 0 ? 'Chọn danh mục cha' : 'Chọn danh mục con'}
        >
          <option value="">{level === 0 ? 'Chọn danh mục*' : 'Chọn danh mục con'}</option>
          {options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      );
      if (!selected) break;
      parentId = selected;
    }
    return selects;
  }

  function handleVariantSizeStockChange(variantId: string, size: string, stock: number) {
    setVariants(prev => prev.map(v =>
      v.id === variantId
        ? { ...v, sizes: v.sizes.map(s => s.size === size ? { ...s, stock } : s) }
        : v
    ));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate độ dài tên sản phẩm, mô tả, tên biến thể, SKU và giá khuyến mãi
    if (name.length > 100) {
      toast.error("Tên sản phẩm không được vượt quá 100 ký tự!");
      return;
    }
    if (description.length > 3000) {
      toast.error("Mô tả sản phẩm không được vượt quá 3000 ký tự!");
      return;
    }
    for (const v of variants) {
      if (v.color.length > 30) {
        toast.error("Tên biến thể (màu) không được vượt quá 30 ký tự!");
        return;
      }
      if (v.sku && v.sku.length > 30) {
        toast.error("SKU không được vượt quá 30 ký tự!");
        return;
      }
      if (v.salePrice && parseFloat(v.salePrice) >= parseFloat(v.price)) {
        toast.error(`Giá khuyến mãi của biến thể ${v.color} phải nhỏ hơn giá gốc!`);
        return;
      }
    }
    // Validate từng điều kiện size
    const hasSizeName = variants.every(v => v.sizes.every(s => s.size));
    const hasStockValue = variants.every(v => v.sizes.every(s => String(s.stock) !== ""));
    const hasValidStock = variants.every(v => v.sizes.every(s => !isNaN(Number(s.stock)) && Number(s.stock) >= 0));
    const valid = variants.every(v =>
      v.color && v.price !== "" && !isNaN(Number(v.price)) &&
      v.sizes.length > 0 &&
      hasSizeName && hasStockValue && hasValidStock
    );
    if (!valid) {
      if (!hasSizeName) {
        toast.error("Có size bị thiếu tên!");
      } else if (!hasStockValue) {
        toast.error("Có size bị thiếu số lượng!");
      } else if (!hasValidStock) {
        toast.error("Có size có số lượng không hợp lệ (phải là số >= 0)!");
      } else {
        toast.error("Vui lòng nhập đầy đủ tên màu, giá và tên size, số lượng (>=0) cho từng biến thể!");
      }
      return;
    }
    if (!name || !selectedCategoryPath.length || variants.length === 0 || (!mainImage?.url && !mainImage?.file)) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc: Tên, danh mục, ảnh chính và ít nhất một biến thể.");
      return;
    }
    try {
      setIsUploading(true);
      // Đảm bảo mainImage là URL Cloudinary
      let mainImageUrl = mainImage?.url;
      if (mainImageUrl && mainImageUrl.startsWith('data:image')) {
        mainImageUrl = await uploadToCloudinary(dataURLtoFile(mainImageUrl, 'main.png'));
      }
      // Đảm bảo additionalImages là URL Cloudinary
      const additionalImagesProcessed = await Promise.all(
        additionalImages.map(async img => {
          if (img.url && img.url.startsWith('data:image')) {
            const url = await uploadToCloudinary(dataURLtoFile(img.url, 'add.png'));
            return { ...img, url };
          }
          return img;
        })
      );
      // Đảm bảo variants[].image là URL Cloudinary
      const variantsProcessed = await Promise.all(
        variants.map(async v => {
          if (v.image && typeof v.image === 'string' && v.image.startsWith('data:image')) {
            const url = await uploadToCloudinary(dataURLtoFile(v.image, 'variant.png'));
            return { ...v, image: url };
          }
          return v;
        })
      );
      setIsUploading(false);
      const cleanVariants = variantsProcessed.map(v => {
        const { stock, ...rest } = v as any;
        return rest;
      });
      // Khi submit, gửi lên API đúng định dạng ProductImage
      const payload = {
        ...(mode === 'edit' && initialData?.id ? { id: initialData.id } : {}),
        name,
        description,
        categoryId: selectedCategoryPath[selectedCategoryPath.length - 1],
        trendId: selectedTrend,
        attributeIds: selectedAttributes,
        image: mainImageUrl,
        images: [
          ...(mainImageUrl ? [{ url: mainImageUrl, isMain: true, order: 0, altText: mainImage?.altText }] : []),
          ...additionalImagesProcessed.map((img, idx) => ({ url: img.url, isMain: false, order: idx + 1, altText: img.altText }))
        ],
        variants: cleanVariants.map(v => ({
          color: v.color,
          sizes: v.sizes.map((s: { size: string; stock: number }) => ({ size: s.size, stock: s.stock })),
          price: parseFloat(v.price),
          salePrice: v.salePrice ? parseFloat(v.salePrice) : null,
          sku: v.sku,
          image: v.image || null,
        }))
      };
      onSubmit(payload);
    } catch (error) {
      setIsUploading(false);
      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi khi upload ảnh.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50/50">
      {cropImage && ( <ImageCropper image={cropImage} onCropDone={handleCropDone} onCancel={handleCropCancel} aspectRatioOptions={imageAspectRatioOptions} /> )}
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" aria-label="Image Upload" />
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="col-span-1 lg:sticky top-8 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Ảnh sản phẩm</h2>
               <div>
                  <label className="font-medium text-sm">Ảnh chính*</label>
                  <div onClick={() => handleFileTrigger({ type: 'main' })} className="relative w-full overflow-hidden rounded-lg shadow-lg aspect-square bg-gray-50 cursor-pointer group mt-1 min-h-[240px]">
                    {mainImage?.url && mainImage.url.startsWith('https://res.cloudinary.com') ? (
                      <Image
                        src={mainImage.url}
                        alt={mainImage.altText || "main"}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon size={32} />
                        <p className="text-xs mt-1">Click để chọn ảnh</p>
                      </div>
                    )}
                  </div>
               </div>
               <div className="mt-4">
                  <label className="font-medium text-sm">Ảnh bổ sung (tối đa 6)</label>
                  <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-2">
                    {additionalImages.map((img, idx) => (
                      !!img.url && img.url.startsWith('https://res.cloudinary.com') ? (
                        <div key={img.url || img.id || idx} className="relative w-20 h-20 rounded-md overflow-hidden cursor-pointer border-2 group flex-none">
                          <Image src={img.url} alt={img.altText || "sub"} fill className="object-cover" loading="lazy" />
                          <button type="button" onClick={() => removeAdditionalImage(img.id!)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-xs z-10" aria-label={`Remove additional image ${img.id}`}> <X size={12}/> </button>
                          <div className="absolute left-1 bottom-1 flex flex-col gap-1">
                            <button type="button" disabled={idx === 0} onClick={() => moveAdditionalImage(idx, idx-1)} className="bg-white/80 rounded p-0.5 text-xs disabled:opacity-30">↑</button>
                            <button type="button" disabled={idx === additionalImages.length-1} onClick={() => moveAdditionalImage(idx, idx+1)} className="bg-white/80 rounded p-0.5 text-xs disabled:opacity-30">↓</button>
                          </div>
                        </div>
                      ) : null
                    ))}
                    {additionalImages.length < 6 && (
                      <button type="button" onClick={() => handleFileTrigger({ type: 'additional' })} className="w-20 h-20 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400 cursor-pointer hover:border-pink-500" aria-label="Add additional image">
                        <PlusIcon size={24} />
                      </button>
                    )}
                  </div>
               </div>
            </div>
          </div>
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Thông tin chung</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="relative">
                   <input type="text" placeholder="Tên sản phẩm*" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded pr-14" required maxLength={100} />
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none bg-white px-1">{name.length}/100</span>
                 </div>
                 {renderCategorySelects()}
              </div>
              <div className="mt-4 relative">
                <textarea placeholder="Mô tả sản phẩm" value={description} onChange={e => setDescription(e.target.value)} rows={6} className="w-full p-2 border rounded pr-14" maxLength={3000}/>
                <span className="absolute right-3 bottom-2 text-xs text-gray-400 pointer-events-none bg-white px-1">{description.length}/3000</span>
              </div>
              <div className="mt-4">
                <label className="font-medium text-sm block mb-1">Thuộc tính</label>
                <div className="flex flex-wrap gap-2">
                  {attributes.map(attr => (
                    <button key={attr.id} type="button" onClick={() => setSelectedAttributes(prev => prev.includes(attr.id) ? prev.filter(id => id !== attr.id) : [...prev, attr.id])} className={`px-3 py-1 text-sm rounded-full border ${selectedAttributes.includes(attr.id) ? 'bg-pink-500 text-white border-pink-500' : 'bg-white hover:border-pink-400'}`}>
                      {attr.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Các biến thể*</h2>
                   <button type="button" onClick={() => addVariant()} className="flex items-center gap-2 bg-pink-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-pink-600">
                      <PlusIcon size={16} /> Thêm thủ công
                    </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Chọn loại kích cỡ để thêm nhanh</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(SIZING_PRESETS).map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSizeType(sizeType === key ? null : (key as SizeType))}
                        className={`px-3 py-1 text-sm rounded-full border ${sizeType === key ? 'bg-pink-500 text-white border-pink-500' : 'bg-white hover:border-pink-400'}`}
                      >
                        {key}
                      </button>
                    ))}
                    {sizeType && (
                      <button type="button" onClick={() => setSizeType(null)} className="text-xs text-gray-500 hover:text-red-500 ml-2">Xóa</button>
                    )}
                  </div>
                </div>
                {sizeType && (
                  <div className="mb-4 p-2 bg-pink-50/50 border border-pink-200 rounded-md">
                    <p className="text-sm font-medium text-pink-800 mb-2">Thêm nhanh size cho: {sizeType}</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZING_PRESETS[sizeType].map(size => (
                        <button
                          type="button"
                          key={size}
                          onClick={() => {
                            setVariants(prev => prev.map(v => v.sizes.some(s => s.size === size) ? v : { ...v, sizes: [...v.sizes, { size, stock: 0 }] }));
                          }}
                          className="bg-pink-100 text-pink-800 px-2 py-1 text-xs rounded-md hover:bg-pink-200 font-semibold"
                        >
                          + {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className={`grid grid-cols-12 gap-3 p-3 border rounded-md relative ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                      <button type="button" onClick={() => removeVariant(variant.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600" aria-label={`Remove variant ${variant.id}`}>×</button>
                      <div className="col-span-12 grid grid-cols-12 gap-4 mb-2 items-start">
                        {/* Ảnh biến thể */}
                        <div className="col-span-2 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleFileTrigger({ type: 'variant', id: variant.id })}
                            className="aspect-square w-20 max-w-[80px] border-2 border-dashed rounded-md flex items-center justify-center text-gray-400 cursor-pointer hover:border-pink-500 bg-white"
                            aria-label={`Add or change image for variant ${variant.id}`}
                          >
                            {variant.image && typeof variant.image === 'string' && variant.image.startsWith('https://res.cloudinary.com') ? (
                              <Image src={variant.image} alt="variant" width={80} height={80} className="object-cover rounded-md" />
                            ) : <ImageIcon size={24} />}
                         </button>
                      </div>
                        {/* Tên biến thể + SKU */}
                        <div className="col-span-5 flex flex-col gap-2">
                          <div className="relative">
                            <input type="text" placeholder="Tên biến thể" value={variant.color} onChange={e => handleVariantChange(variant.id, 'color', e.target.value)} className="p-2 border rounded w-full pr-14" required aria-label="Tên biến thể" maxLength={30} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none bg-white px-1">{variant.color.length}/30</span>
                          </div>
                          <div className="relative">
                            <input type="text" placeholder="SKU" value={variant.sku} onChange={e => handleVariantChange(variant.id, 'sku', e.target.value)} className="p-2 border rounded w-full pr-14" aria-label="SKU" maxLength={30} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none bg-white px-1">{variant.sku.length}/30</span>
                          </div>
                         </div>
                        {/* Giá gốc + Giá KM */}
                        <div className="col-span-5 flex flex-col gap-2">
                          <input type="text" placeholder="Giá gốc*" value={formatCurrencyInput(variant.price)} onChange={e => handleVariantChange(variant.id, 'price', e.target.value.replace(/\D/g, ""))} className="p-2 border rounded w-full" required aria-label="Variant price" />
                          <input type="text" placeholder="Giá KM" value={formatCurrencyInput(variant.salePrice)} onChange={e => handleVariantChange(variant.id, 'salePrice', e.target.value.replace(/\D/g, ""))} className="p-2 border rounded w-full" aria-label="Variant sale price" />
                        </div>
                      </div>
                      {/* Size nằm hàng thứ 2 */}
                      <div className="col-span-12 flex flex-wrap gap-2 items-center mb-2">
                           {(variant.sizes || []).map(({ size, stock }) => (
                          <div key={size} className="flex items-center gap-1 bg-pink-500 text-white rounded px-2 py-1">
                            <span>{size}</span>
                            <input type="number" min={0} value={stock} onChange={e => handleVariantSizeStockChange(variant.id, size, Number(e.target.value))} className="w-12 p-1 rounded text-black" aria-label={`Stock for size ${size}`} />
                               <button type="button" onClick={() => handleVariantChange(variant.id, 'sizes', (variant.sizes || []).filter(s => s.size !== size))} className="ml-1 text-white hover:text-red-200">×</button>
                          </div>
                           ))}
                        {/* Nút thêm size nhanh */}
                           {sizeType && SIZING_PRESETS[sizeType].filter(size => !variant.sizes.some(s => s.size === size)).map(size => (
                             <button
                               key={size}
                               type="button"
                               onClick={() => handleVariantChange(variant.id, 'sizes', [...variant.sizes, { size, stock: 0 }])}
                               className="px-2 py-1 text-xs rounded border bg-white border-gray-300 hover:border-pink-400"
                             >
                               {size}
                             </button>
                           ))}
                           <input
                             type="text"
                             placeholder="+ Tự do"
                             className="w-14 min-w-[48px] p-1 text-xs border rounded flex-shrink-0"
                             onKeyDown={e => {
                               if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                 e.preventDefault();
                                 const newSize = e.currentTarget.value.trim();
                                 if (!variant.sizes.some(s => s.size === newSize)) {
                                   handleVariantChange(
                                     variant.id,
                                     'sizes',
                                     [...variant.sizes, { size: newSize, stock: 0 }]
                                   );
                                 }
                                 e.currentTarget.value = '';
                               }
                             }}
                             aria-label="Thêm size tuỳ chọn"
                           />
                      </div>
                    </div>
                  ))}
                  {variants.length === 0 && <p className="text-center text-gray-500 py-4">Thêm một biến thể để bắt đầu.</p>}
                </div>
            </div>
          </div>
        </div>
        <button type="submit" disabled={loading || isUploading} className="w-full mt-6 bg-pink-500 text-white font-bold py-3 rounded-md hover:bg-pink-600 disabled:bg-gray-400">
           {loading || isUploading ? 'Đang lưu...' : (mode === 'add' ? 'Thêm sản phẩm' : 'Lưu chỉnh sửa')}
        </button>
      </form>
    </div>
  );
} 