"use client";

import { Fragment, useState, useRef, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, TrashIcon, PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Color {
  name: string;
  value: string;
  image: string | null;
}

interface Size {
  name: string;
}

interface Attribute {
  id: string;
  name: string;
}

interface Trend {
  id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  salePrice?: number; // Optional sale price
  sku?: string; // Stock keeping unit
  image: string;
  images: string[];
  categoryId: string;
  stock: number;
  colors: Color[];
  sizes: Size[];
  attributes: string[];
  trendId?: string;
}

export default function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [sku, setSku] = useState("");
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [stock, setStock] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedTrend, setSelectedTrend] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [currentColorIndex, setCurrentColorIndex] = useState<number>(-1);
  const [salePriceError, setSalePriceError] = useState("");

  // Common size presets for different product types
  const clothingSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const shoeSizes = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
  const commonSizes = ["S", "M", "L"];

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [categoriesResponse, attributesResponse, trendsResponse] = await Promise.all([
            fetch('/api/admin/categories'),
            fetch('/api/admin/attributes'),
            fetch('/api/trends')
          ]);
  
          if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
          if (!attributesResponse.ok) throw new Error('Failed to fetch attributes');
          if (!trendsResponse.ok) throw new Error('Failed to fetch trends');
  
          const categoriesData = await categoriesResponse.json();
          const attributesData = await attributesResponse.json();
          const trendsData = await trendsResponse.json();
  
          setCategories(categoriesData);
          setAttributes(attributesData);
          setTrends(trendsData);
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error('Không thể tải dữ liệu');
        }
      };
  
      fetchData();
    }
  }, [isOpen]);

  // Kiểm tra giá khuyến mãi phải thấp hơn giá gốc
  useEffect(() => {
    if (salePrice && price) {
      const saleValue = parseFloat(salePrice);
      const priceValue = parseFloat(price);
      
      if (saleValue >= priceValue) {
        setSalePriceError("Giá khuyến mãi phải thấp hơn giá gốc");
      } else {
        setSalePriceError("");
      }
    } else {
      setSalePriceError("");
    }
  }, [salePrice, price]);

  const handleAttributeToggle = (attributeId: string) => {
    setSelectedAttributes(prev => {
      if (prev.includes(attributeId)) {
        return prev.filter(id => id !== attributeId);
      } else {
        return [...prev, attributeId];
      }
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error("Hình ảnh không được vượt quá 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Kiểm tra số lượng ảnh tối đa (6 ảnh phụ + 1 ảnh chính = 7 ảnh)
    if (additionalImages.length + files.length > 6) {
      toast.error("Tối đa chỉ được tải lên 6 ảnh phụ");
      return;
    }

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(`Hình ảnh ${file.name} vượt quá 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleColorImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentColorIndex !== -1) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error("Hình ảnh không được vượt quá 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newColors = [...colors];
        newColors[currentColorIndex] = {
          ...newColors[currentColorIndex],
          image: reader.result as string
        };
        setColors(newColors);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorAdd = () => {
    const newColor: Color = {
      name: "",
      value: "",
      image: null
    };
    setColors([...colors, newColor]);
  };

  const handleSizeAdd = () => {
    const newSize: Size = {
      name: "",
    };
    setSizes([...sizes, newSize]);
  };

  const handleColorChange = (index: number, field: keyof Color, value: string) => {
    const newColors = [...colors];
    newColors[index] = { ...newColors[index], [field]: value };
    setColors(newColors);
  };

  const handleSizeChange = (index: number, name: string) => {
    const newSizes = [...sizes];
    newSizes[index] = { name };
    setSizes(newSizes);
  };

  const handleColorDelete = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  // Add a preset of sizes
  const handleAddSizePreset = (preset: string[]) => {
    setSizes(preset.map(name => ({ name })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra các trường bắt buộc
    if (!name || !price || !selectedImage || !stock || !selectedCategory) {
      toast.error("Vui lòng điền đầy đủ thông tin sản phẩm");
      return;
    }

    // Kiểm tra giá khuyến mãi
    if (salePriceError) {
      toast.error("Vui lòng sửa lỗi giá khuyến mãi");
      return;
    }

    if (colors.length === 0) {
      toast.error("Vui lòng thêm ít nhất một màu sắc");
      return;
    }

    if (sizes.length === 0) {
      toast.error("Vui lòng thêm ít nhất một kích thước");
      return;
    }

    // Nếu mô tả trống, sử dụng "Đang cập nhật"
    const finalDescription = description.trim() ? description : "Đang cập nhật";

    try {
      const productData = {
        name,
        description: finalDescription,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        sku,
        image: selectedImage,
        images: additionalImages,
        colors,
        sizes,
        stock: parseInt(stock),
        categoryId: selectedCategory,
        attributes: selectedAttributes,
        trendId: selectedTrend || undefined
      };

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Lỗi khi thêm sản phẩm');
      }

      toast.success('Thêm sản phẩm thành công');
      onClose();
      
      // Reset form
      setName("");
      setDescription("");
      setPrice("");
      setSalePrice("");
      setSku("");
      setSelectedImage(null);
      setAdditionalImages([]);
      setColors([]);
      setSizes([]);
      setStock("");
      setSelectedCategory("");
      setSelectedAttributes([]);
      setSelectedTrend("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm sản phẩm');
      console.error('Error:', error);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Đóng</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Thêm sản phẩm mới
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Điền thông tin sản phẩm bên dưới
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Tên sản phẩm
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Mô tả
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Nhập mô tả sản phẩm hoặc để trống để hiển thị 'Đang cập nhật'"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Giá
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type="number"
                          name="price"
                          id="price"
                          required
                          min="0"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-12"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">VND</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700">
                        Giá khuyến mãi (để trống nếu không có)
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type="number"
                          name="salePrice"
                          id="salePrice"
                          min="0"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-12 ${
                            salePriceError ? 'border-red-500' : ''
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">VND</span>
                        </div>
                      </div>
                      {salePriceError && (
                        <p className="mt-1 text-sm text-red-500">{salePriceError}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                        Mã sản phẩm (SKU)
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="sku"
                          id="sku"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="VD: SP001"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                        Số lượng trong kho
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="stock"
                          id="stock"
                          required
                          min="0"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Danh mục
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="trend" className="block text-sm font-medium text-gray-700">
                        Xu hướng thời trang
                      </label>
                      <select
                        id="trend"
                        name="trend"
                        value={selectedTrend}
                        onChange={(e) => setSelectedTrend(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Không thuộc xu hướng nào</option>
                        {trends.map((trend) => (
                          <option key={trend.id} value={trend.id}>
                            {trend.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Hình ảnh sản phẩm chính
                      </label>
                      <div className="mt-1 flex items-center space-x-4">
                        <div
                          className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-indigo-500"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {selectedImage ? (
                            <Image
                              src={selectedImage}
                              alt="Preview"
                              width={128}
                              height={128}
                              className="h-full w-full object-cover rounded-md"
                            />
                          ) : (
                            <div className="text-center">
                              <div className="text-sm text-gray-600">
                                Click để chọn ảnh
                              </div>
                              <div className="text-xs text-gray-500">
                                (Tối đa 5MB)
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          title="Chọn ảnh sản phẩm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Hình ảnh sản phẩm bổ sung (tối đa 6 ảnh)
                      </label>
                      <div className="mt-1">
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                          {additionalImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <div className="h-20 w-20 overflow-hidden rounded-md border border-gray-300">
                                <Image
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  width={80}
                                  height={80}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAdditionalImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Xóa ảnh"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          {additionalImages.length < 6 && (
                            <div 
                              className="h-20 w-20 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-indigo-500 cursor-pointer"
                              onClick={() => additionalImagesInputRef.current?.click()}
                            >
                              <PhotoIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={additionalImagesInputRef}
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleAdditionalImagesUpload}
                          title="Chọn ảnh bổ sung"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Tải lên thêm tối đa 6 ảnh chi tiết về sản phẩm
                        </p>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">
                          Màu sắc
                        </label>
                        <button
                          type="button"
                          onClick={handleColorAdd}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          Thêm màu
                        </button>
                      </div>
                      <div className="mt-2 space-y-4">
                        {colors.map((color, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <input
                              type="text"
                              placeholder="Tên màu"
                              value={color.name}
                              onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                              className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <input
                              type="color"
                              value={color.value}
                              onChange={(e) => handleColorChange(index, 'value', e.target.value)}
                              className="h-9 w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              title="Chọn màu sắc"
                            />
                            <div 
                              className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border border-gray-300"
                              onClick={() => {
                                setCurrentColorIndex(index);
                                colorFileInputRef.current?.click();
                              }}
                            >
                              {color.image ? (
                                <Image
                                  src={color.image}
                                  alt={`Color ${color.name}`}
                                  width={80}
                                  height={80}
                                  className="h-full w-full object-cover rounded-md"
                                />
                              ) : (
                                <div className="text-center text-sm text-gray-500">
                                  Thêm ảnh
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleColorDelete(index)}
                              className="rounded-md text-red-600 hover:text-red-800"
                              title="Xóa màu sắc"
                            >
                              <TrashIcon className="h-5 w-5" aria-label="Xóa màu sắc" />
                            </button>
                          </div>
                        ))}
                        <input
                          type="file"
                          ref={colorFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleColorImageUpload}
                          title="Chọn ảnh cho màu sắc"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">
                          Kích thước
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddSizePreset(commonSizes)}
                            className="inline-flex items-center px-2 py-1 text-xs border border-transparent font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            Thêm S/M/L
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddSizePreset(clothingSizes)}
                            className="inline-flex items-center px-2 py-1 text-xs border border-transparent font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            Áo quần
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddSizePreset(shoeSizes)}
                            className="inline-flex items-center px-2 py-1 text-xs border border-transparent font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
                          >
                            Giày
                          </button>
                          <button
                            type="button"
                            onClick={handleSizeAdd}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                          >
                            Thêm
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((size, index) => (
                            <div key={index} className="flex items-center gap-1 bg-gray-100 p-1 rounded">
                              <input
                                type="text"
                                placeholder="Size"
                                value={size.name}
                                onChange={(e) => handleSizeChange(index, e.target.value)}
                                className="block w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newSizes = [...sizes];
                                  newSizes.splice(index, 1);
                                  setSizes(newSizes);
                                }}
                                className="text-red-600 hover:text-red-800"
                                aria-label="Remove size"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Thuộc tính sản phẩm
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {attributes.map((attribute) => (
                          <div key={attribute.id} className="relative flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                type="checkbox"
                                id={`attribute-${attribute.id}`}
                                checked={selectedAttributes.includes(attribute.id)}
                                onChange={() => handleAttributeToggle(attribute.id)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor={`attribute-${attribute.id}`} className="text-gray-700">
                                {attribute.name}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                    >
                      Thêm sản phẩm
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                      onClick={onClose}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 