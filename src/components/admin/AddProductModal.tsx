"use client";

import { Fragment, useState, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Attribute {
  id: string;
  name: string;
}

interface Color {
  name: string;
  value: string;
  image: string;
}

interface Size {
  name: string;
  value: string;
}

export default function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorAdd = () => {
    const newColor: Color = {
      name: "",
      value: "",
      image: "",
    };
    setColors([...colors, newColor]);
  };

  const handleSizeAdd = () => {
    const newSize: Size = {
      name: "",
      value: "",
    };
    setSizes([...sizes, newSize]);
  };

  const handleColorChange = (index: number, field: keyof Color, value: string) => {
    const newColors = [...colors];
    newColors[index] = { ...newColors[index], [field]: value };
    setColors(newColors);
  };

  const handleSizeChange = (index: number, field: keyof Size, value: string) => {
    const newSizes = [...sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setSizes(newSizes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add product submission logic here
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
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hình ảnh
                      </label>
                      <div className="mt-1 flex items-center space-x-4">
                        <div
                          className="flex h-32 w-32 items-center justify-center rounded-md border-2 border-dashed border-gray-300"
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
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Màu sắc
                      </label>
                      <div className="mt-1 space-y-2">
                        {colors.map((color, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder="Tên màu"
                              value={color.name}
                              onChange={(e) => handleColorChange(index, "name", e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <input
                              type="color"
                              value={color.value}
                              onChange={(e) => handleColorChange(index, "value", e.target.value)}
                              className="h-8 w-8 rounded-md border-gray-300"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    handleColorChange(index, "image", reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleColorAdd}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          Thêm màu
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Kích thước
                      </label>
                      <div className="mt-1 space-y-2">
                        {sizes.map((size, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder="Tên size"
                              value={size.name}
                              onChange={(e) => handleSizeChange(index, "name", e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Giá trị"
                              value={size.value}
                              onChange={(e) => handleSizeChange(index, "value", e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleSizeAdd}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          Thêm size
                        </button>
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