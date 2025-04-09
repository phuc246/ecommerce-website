"use client";

import { Fragment, useState, useRef, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    categoryId: string;
    category: {
      id: string;
      name: string;
    };
    colors: Array<{
      id: string;
      name: string;
      value: string;
      image: string | null;
    }>;
    sizes: Array<{
      id: string;
      name: string;
    }>;
    attributes: Array<{
      id: string;
      name: string;
    }>;
  };
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

export default function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.price.toString());
  const [colors, setColors] = useState<Color[]>(
    product.colors.map(c => ({
      name: c.name,
      value: c.value,
      image: c.image
    }))
  );
  const [sizes, setSizes] = useState<Size[]>(
    product.sizes.map(s => ({
      name: s.name
    }))
  );
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [stock, setStock] = useState(product.stock.toString());
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(product.categoryId);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(
    product.attributes.map(a => a.id)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [currentColorIndex, setCurrentColorIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, attributesResponse] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/attributes')
        ]);

        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        if (!attributesResponse.ok) throw new Error('Failed to fetch attributes');

        const categoriesData = await categoriesResponse.json();
        const attributesData = await attributesResponse.json();

        setCategories(categoriesData);
        setAttributes(attributesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Không thể tải dữ liệu');
      }
    };

    fetchData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description || !price || !selectedImage || !stock || !selectedCategory) {
      toast.error("Vui lòng điền đầy đủ thông tin sản phẩm");
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

    try {
      const response = await fetch(`/api/admin/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: product.id,
          name,
          description,
          price: parseFloat(price),
          image: selectedImage,
          colors,
          sizes,
          stock: parseInt(stock),
          categoryId: selectedCategory,
          attributes: selectedAttributes
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Lỗi khi cập nhật sản phẩm');
      }

      toast.success('Cập nhật sản phẩm thành công');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật sản phẩm');
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
                      Chỉnh sửa sản phẩm
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Cập nhật thông tin sản phẩm bên dưới
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
                          required
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Giá
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="price"
                          id="price"
                          required
                          min="0"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                      <label className="block text-sm font-medium text-gray-700">
                        Hình ảnh sản phẩm
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
                        <button
                          type="button"
                          onClick={handleSizeAdd}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          Thêm kích thước
                        </button>
                      </div>
                      <div className="mt-2 space-y-4">
                        {sizes.map((size, index) => (
                          <div key={index} className="flex items-center">
                            <input
                              type="text"
                              placeholder="Kích thước (VD: S, M, L, XL)"
                              value={size.name}
                              onChange={(e) => handleSizeChange(index, e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        ))}
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
                      Cập nhật
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