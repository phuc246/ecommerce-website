"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCartIcon, ArrowLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useMouseMove } from "@/hooks/useMouseMove";
import toast from "react-hot-toast";

interface Color {
  id: string;
  name: string;
  value: string;
  image: string | null;
}

interface Size {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: {
    id: string;
    name: string;
  };
  colors: Color[];
  sizes: Size[];
  attributes: {
    id: string;
    name: string;
    value: string;
  }[];
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Refs for animation effects
  const imageRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const imageStyle = useMouseMove(imageRef, 0.04);
  const detailsStyle = useMouseMove(detailsRef, 0.02);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) throw new Error("Failed to fetch product");
        const data = await response.json();
        setProduct(data);
        
        // Initialize first color and size if available
        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0].id);
        }
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0].id);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || !selectedColor || !selectedSize) {
      toast.error("Vui lòng chọn màu sắc và kích thước");
      return;
    }

    if (quantity < 1) {
      toast.error("Số lượng không hợp lệ");
      return;
    }

    setAddingToCart(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          colorId: selectedColor,
          sizeId: selectedSize,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      // Show success message and animation
      setAddedToCart(true);
      toast.success("Đã thêm vào giỏ hàng");

      // Reset after 2 seconds
      setTimeout(() => {
        setAddedToCart(false);
      }, 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Không thể thêm vào giỏ hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  const getSelectedColorObject = () => {
    if (!product || !selectedColor) return null;
    return product.colors.find(color => color.id === selectedColor) || null;
  };

  const getSelectedSizeObject = () => {
    if (!product || !selectedSize) return null;
    return product.sizes.find(size => size.id === selectedSize) || null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Sản phẩm không tồn tại</h1>
          <p className="mt-4 text-gray-500">Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link href="/products" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-900">Trang chủ</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link href="/products" className="text-gray-500 hover:text-gray-900">Sản phẩm</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="font-medium text-gray-900">{product.name}</li>
        </ol>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Product image */}
          <div 
            ref={imageRef}
            className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100" 
            style={imageStyle}
          >
            <Image
              src={getSelectedColorObject()?.image || product.image}
              alt={product.name}
              fill
              priority
              className="object-cover object-center transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Còn hàng
              </span>
            </div>
          </div>

          {/* Product details */}
          <div 
            ref={detailsRef}
            className="mt-10 lg:mt-0 lg:pl-8" 
            style={detailsStyle}
          >
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(product.price)}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Mô tả</h3>
              <div 
                className="mt-2 prose prose-sm text-gray-600" 
                dangerouslySetInnerHTML={{ __html: product.description }} 
              />
            </div>

            {/* Colors */}
            {product.colors.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900">Màu sắc</h3>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={`relative h-12 w-12 rounded-full border border-gray-300 flex items-center justify-center transition-all 
                        ${selectedColor === color.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}
                      `}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.id)}
                      aria-label={`Màu ${color.name}`}
                    >
                      {selectedColor === color.id && (
                        <CheckIcon className="h-5 w-5 text-white" />
                      )}
                      <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mt-10">
                <h3 className="text-sm font-medium text-gray-900">Kích thước</h3>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      className={`px-4 py-2 rounded border text-sm font-medium transition-all
                        ${selectedSize === size.id 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                      onClick={() => setSelectedSize(size.id)}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="mt-10">
                <h3 className="text-sm font-medium text-gray-900">Thông số kỹ thuật</h3>
                <div className="mt-4 border-t border-gray-200">
                  <dl className="divide-y divide-gray-200">
                    {product.attributes.map((attr) => (
                      <div key={attr.id} className="py-3 flex justify-between text-sm">
                        <dt className="text-gray-500">{attr.name}</dt>
                        <dd className="text-gray-900 font-medium">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-10">
              <h3 className="text-sm font-medium text-gray-900">Số lượng</h3>
              <div className="flex items-center mt-3 space-x-3">
                <button
                  type="button"
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="text-gray-900 font-medium">{quantity}</span>
                <button
                  type="button"
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <div className="mt-10">
              <button
                type="button"
                className={`w-full py-3 px-8 rounded-lg text-white font-medium flex items-center justify-center transition-all ${
                  addingToCart 
                    ? 'bg-gray-400 cursor-not-allowed'
                    : addedToCart
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang thêm...
                  </span>
                ) : addedToCart ? (
                  <span className="flex items-center">
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Đã thêm vào giỏ hàng
                  </span>
                ) : (
                  <span className="flex items-center">
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Thêm vào giỏ hàng
                  </span>
                )}
              </button>
            </div>

            {/* Shipping info */}
            <div className="mt-10">
              <div className="rounded-lg bg-gray-50 px-4 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3 text-sm text-gray-600">
                    Giao hàng dự kiến trong 3-5 ngày làm việc
                  </div>
                </div>
                <div className="flex items-center mt-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="ml-3 text-sm text-gray-600">
                    Thanh toán khi nhận hàng
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 