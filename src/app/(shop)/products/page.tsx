"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCategoryScroll } from "@/hooks/useCategoryScroll";
import { ShoppingBagIcon, HeartIcon } from "@heroicons/react/24/outline";
import { useLogo } from '@/hooks/useLogo';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/use-wishlist';
import { toast } from 'sonner';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: {
    id: string;
    name: string;
  };
  minSalePrice?: number;
  maxSalePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  colors?: { name: string; value: string }[];
  attributes?: { id: string; name: string }[];
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [videoBackground, setVideoBackground] = useState("");
  const [randomHighlightIdx, setRandomHighlightIdx] = useState<number | null>(null);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);
  
  const {
    containerRef,
    handleMouseEnter,
    handleMouseLeave,
    handleScroll,
    pauseAnimation,
    resumeAnimation
  } = useCategoryScroll(categories);

  const { url: logoUrl, isCircular, isLoading: logoLoading, refresh: refreshLogo } = useLogo();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products/shop");
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        const productList = Array.isArray(data) ? data : data.products || [];
        setProducts(productList);
        setFilteredProducts(productList);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data?.value) {
          const settings = JSON.parse(data.value);
          setVideoBackground(settings.videoBackground || "/videos/underwater-light-filters-down-through-blue-ocean-waves_5357500.mp4");
        }
      });
  }, []);

  // Filter products when category changes
  useEffect(() => {
    if (selectedCategory) {
      setFilteredProducts(
        products.filter(product => product.category.id === selectedCategory)
      );
    } else {
      setFilteredProducts(products);
    }
  }, [selectedCategory, products]);

  useEffect(() => {
    if (!filteredProducts.length) return;
    const interval = setInterval(() => {
      setRandomHighlightIdx(Math.floor(Math.random() * filteredProducts.length));
    }, 5000);
    setRandomHighlightIdx(Math.floor(Math.random() * filteredProducts.length));
    return () => clearInterval(interval);
  }, [filteredProducts]);

  useEffect(() => {
    if (!selectedAttributeId) {
      setFilteredProducts(products);
      return;
    }
    setFilteredProducts(products.filter(p => p.attributes && p.attributes.some(a => a.id === selectedAttributeId)));
  }, [selectedAttributeId, products]);

  const handleCategoryClick = (categoryId: string | null) => {
    pauseAnimation();
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setTimeout(resumeAnimation, 500);
  };

  // Icon nổi wishlist + cart (dùng sản phẩm đầu tiên làm mẫu demo, có thể tuỳ chỉnh theo UX thực tế)
  const firstProduct = filteredProducts[0];
  const wishlisted = firstProduct ? isWishlisted(firstProduct.id) : false;
  const handleFloatingWishlist = async () => {
    if (!firstProduct) return;
    if (wishlisted) {
      await removeFromWishlist(firstProduct.id);
      toast.success('Đã bỏ khỏi yêu thích!');
    } else {
      await addToWishlist(firstProduct.id);
      toast.success('Đã lưu vào yêu thích!');
    }
  };
  const handleFloatingCart = () => {
    if (!firstProduct) return;
    // Tuỳ chỉnh logic thêm vào giỏ hàng nếu muốn
    toast.success('Đã thêm vào giỏ hàng!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-b from-blue-50 to-pink-50">
      {/* Background with parallax */}
      <div
        className="absolute inset-0 -z-0 pointer-events-none bg-gradient-to-b from-gray-100 to-gray-200"
      />
      {/* Video background section với tiêu đề đè lên */}
      <div className="relative w-full h-[300px] z-10 overflow-hidden rounded-2xl mb-2 shadow flex items-center justify-center">
        <video
          src={videoBackground}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-center">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-4"
          >
            Bộ sưu tập sản phẩm
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="text-lg md:text-2xl text-white drop-shadow max-w-2xl mx-auto px-4"
          >
            Khám phá bộ sưu tập đa dạng các sản phẩm chất lượng của chúng tôi
          </motion.p>
        </div>
        <div className="absolute inset-0 bg-black/30" />
      </div>
      {/* Category scroll section */}
      <div className="relative z-10 mt-0">
        <div 
          ref={containerRef}
          className="flex space-x-3 py-2 px-2 overflow-x-auto hide-scrollbar relative bg-white rounded-lg shadow"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onScroll={handleScroll}
        >
          {/* Left shadow fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          {categories.map((category) => (
            <div
              key={category.id}
              className={`flex-shrink-0 cursor-pointer p-4 rounded-xl transition-all duration-300 transform ${
                selectedCategory === category.id ? 'bg-indigo-100 shadow-md scale-105' : 'hover:bg-gray-100 hover:scale-105'
              }`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="text-center">
                <div className={`h-16 w-16 mx-auto border border-gray-200 overflow-hidden mb-2 bg-white flex items-center justify-center ${isCircular ? 'rounded-full' : ''}`}>
                  {!logoLoading && logoUrl && (
                    <Image
                      src={logoUrl}
                      alt={category.name}
                      width={64}
                      height={64}
                      className={`object-contain ${isCircular ? 'rounded-full' : ''}`}
                      unoptimized={logoUrl.startsWith('data:')}
                    />
                  )}
                </div>
                <span className="text-sm font-medium">{category.name}</span>
              </div>
            </div>
          ))}
          {/* Right shadow fade effect */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        </div>
      </div>
      {/* Product attribute bar section */}
      <div className="relative z-10 mt-1 mb-2">
        <div className="flex items-center py-2 px-2 bg-white rounded-lg shadow min-h-[44px]">
          <span className="font-semibold text-sm text-gray-700 flex-shrink-0 mr-3">Hôm nay bạn sẽ:</span>
          <div className="flex space-x-2 overflow-x-auto hide-scrollbar flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {(() => {
              // Lấy tất cả thuộc tính từ filteredProducts hoặc products nếu chưa lọc
              const attrMap = new Map();
              (selectedAttributeId ? products : filteredProducts).forEach(p => {
                if (p.attributes) {
                  p.attributes.forEach(attr => {
                    if (!attrMap.has(attr.id)) {
                      attrMap.set(attr.id, attr);
                    }
                  });
                }
              });
              const attrs = Array.from(attrMap.values());
              if (attrs.length === 0) return <span className="text-gray-400 text-sm">Không có thuộc tính sản phẩm</span>;
              return attrs.map(attr => (
                <button
                  key={attr.id}
                  className={`inline-block px-3 py-1 rounded-full border text-xs font-medium shadow-sm whitespace-nowrap mr-2 transition-colors duration-200 ${selectedAttributeId === attr.id ? 'bg-pink-500 text-white border-pink-600' : 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100'}`}
                  onClick={() => setSelectedAttributeId(selectedAttributeId === attr.id ? null : attr.id)}
                  style={{ minWidth: 80 }}
                >
                  {attr.name}
                </button>
              ));
            })()}
          </div>
        </div>
      </div>
      {/* Main content area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 min-h-[70vh] flex flex-col">
        <div className="flex flex-col md:flex-row gap-8 flex-grow">
          <div className="md:w-3/4 lg:w-4/5 flex flex-col flex-grow mx-auto">
            <p className="text-sm text-gray-500 mb-6 text-center">
              {selectedCategory 
                ? `Hiển thị ${filteredProducts.length} sản phẩm trong ${categories.find(c => c.id === selectedCategory)?.name || 'danh mục'}`
                : `Hiển thị tất cả ${filteredProducts.length} sản phẩm`}
            </p>
            <div className="flex-grow">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 min-h-[400px]">
                  {filteredProducts.map((product, idx) => (
                    <div key={product.id} className="group relative">
                      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col border border-gray-100">
                        <div className="relative aspect-square overflow-hidden">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="inline-block bg-white/80 px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow">
                              {product.category.name}
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="flex flex-col sm:flex-row gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                              <Link
                                href={`/products/${product.id}`}
                                className="bg-white text-gray-800 hover:bg-indigo-50 px-4 py-2 rounded-full shadow font-medium text-sm flex items-center border border-gray-200"
                              >
                                Xem chi tiết
                              </Link>
                              <button 
                                className="bg-white text-pink-500 hover:text-pink-600 p-2 rounded-full shadow flex items-center justify-center border border-pink-200 transition-colors"
                                aria-label="Thêm vào giỏ hàng"
                                title="Thêm vào giỏ hàng"
                              >
                                <ShoppingBagIcon className="h-5 w-5" />
                              </button>
                              <button 
                                className={`bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-4 shadow transition-colors flex items-center justify-center ${isWishlisted(product.id) ? 'text-red-500 fill-red-500' : ''}`}
                                aria-label={isWishlisted(product.id) ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
                                title={isWishlisted(product.id) ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (isWishlisted(product.id)) {
                                    await removeFromWishlist(product.id);
                                    toast.success('Đã bỏ khỏi yêu thích!');
                                  } else {
                                    await addToWishlist(product.id);
                                    toast.success('Đã lưu vào yêu thích!');
                                  }
                                }}
                              >
                                <Heart size={24} className={isWishlisted(product.id) ? 'text-red-500 fill-red-500' : ''} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 flex-grow flex flex-col items-center">
                          <Link href={`/products/${product.id}`} className="flex-grow w-full">
                            <h3
                              key={randomHighlightIdx === idx ? `shine-${idx}-${randomHighlightIdx}` : `normal-${idx}`}
                              className={`text-lg font-semibold line-clamp-2 text-center transition-colors duration-300
                                text-pink-400 group-hover:text-pink-500
                                ${randomHighlightIdx === idx ? 'gradient-pulse-glow' : ''}
                              `}
                            >
                              {product.name}
                            </h3>
                          </Link>
                          {/* Hiển thị màu sản phẩm dạng icon tròn nhỏ */}
                          {product.colors && product.colors.length > 0 && (
                            <div className="flex gap-1 mb-1 mt-1 justify-center">
                              {product.colors.map((color, idx) => (
                                <span key={idx} className="product-color-dot" style={{ '--product-color': color.value } as React.CSSProperties} title={color.name}></span>
                              ))}
                            </div>
                          )}
                          <div className="mt-3 flex flex-col items-center gap-1 w-full">
                            {typeof product.minSalePrice === 'number' && product.minSalePrice > 0 ? (
                              <>
                                <div className="flex items-center gap-2 justify-center w-full">
                                  {typeof product.minPrice === 'number' && product.minPrice > 0 && (
                                    <span className="text-base text-gray-400 line-through">
                                      {`₫${new Intl.NumberFormat('vi-VN').format(product.minPrice)}${product.maxPrice && product.maxPrice !== product.minPrice ? ' - ₫' + new Intl.NumberFormat('vi-VN').format(product.maxPrice) : ''}`}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 justify-center w-full">
                                  <span className="text-lg font-bold text-pink-500">
                                    {`₫${new Intl.NumberFormat('vi-VN').format(product.minSalePrice)}${product.maxSalePrice && product.maxSalePrice !== product.minSalePrice ? ' - ₫' + new Intl.NumberFormat('vi-VN').format(product.maxSalePrice) : ''}`}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                {typeof product.minPrice === 'number' ?
                                  `₫${new Intl.NumberFormat('vi-VN').format(product.minPrice)}${product.maxPrice && product.maxPrice !== product.minPrice ? ' - ₫' + new Intl.NumberFormat('vi-VN').format(product.maxPrice) : ''}`
                                  : 'Đang cập nhật'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 min-h-[400px] flex flex-col justify-center items-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7h16M4 11h16M4 15h10" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Không tìm thấy sản phẩm</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Không có sản phẩm nào trong danh mục này. Vui lòng chọn danh mục khác.
                  </p>
                </div>
              )}
            </div>
            {/* Pagination - Luôn hiển thị ở cuối danh sách */}
            <div className="mt-10 flex justify-center">
              <nav className="inline-flex -space-x-px rounded-lg shadow bg-white border border-gray-200" aria-label="Pagination">
                <button className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-100 transition" aria-label="Previous">
                  <span>&lt;</span>
                </button>
                {/* Ví dụ: 3 trang, có thể thay bằng map nếu có nhiều trang */}
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-200 bg-indigo-50 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition">1</button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 transition">2</button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 transition">3</button>
                <button className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-100 transition" aria-label="Next">
                  <span>&gt;</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* Icon nổi wishlist + cart */}
      <div className="fixed left-6 bottom-6 z-50 flex flex-col gap-6">
        {/* Wishlist Floating Button */}
        <button
          className="bg-pink-200 text-pink-600 rounded-full shadow-lg p-4 flex items-center justify-center hover:bg-pink-300 transition-colors group"
          onClick={handleFloatingWishlist}
          aria-label={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
          title={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
        >
          <motion.span
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="flex"
          >
            <Heart className="h-7 w-7" />
          </motion.span>
        </button>
        {/* Cart Floating Button */}
        <button
          className="bg-pink-400 text-white rounded-full shadow-lg p-4 flex items-center justify-center hover:bg-pink-500 transition-colors group"
          onClick={handleFloatingCart}
          aria-label="Thêm vào giỏ hàng"
          title="Thêm vào giỏ hàng"
        >
          <ShoppingCartIcon className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
} 