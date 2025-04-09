"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParallax } from "@/hooks/useParallax";
import { useCategoryScroll } from "@/hooks/useCategoryScroll";
import { ShoppingBagIcon, HeartIcon } from "@heroicons/react/24/outline";
import AdvancedSearch from "@/components/home/AdvancedSearch";

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
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  const parallaxBg = useParallax(0.5);
  const parallaxTitle = useParallax(0.2);
  const parallaxProducts = useParallax(-0.1);
  
  const {
    containerRef,
    handleMouseEnter,
    handleMouseLeave,
    handleScroll,
    pauseAnimation,
    resumeAnimation
  } = useCategoryScroll(categories);

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

  const handleCategoryClick = (categoryId: string | null) => {
    pauseAnimation();
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setTimeout(resumeAnimation, 500);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background with parallax */}
      <div
        className="absolute inset-0 z-0"
        style={{
          ...parallaxBg,
          backgroundImage: "linear-gradient(to bottom, #f3f4f6, #e5e7eb)",
        }}
      />

      {/* Title section with parallax */}
      <div
        className="relative z-10 text-center py-12 mb-2"
        style={parallaxTitle}
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bộ sưu tập sản phẩm
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto px-4">
          Khám phá bộ sưu tập đa dạng các sản phẩm chất lượng của chúng tôi
        </p>
      </div>

      {/* Scrolling categories */}
      <div className="relative z-10 mb-8">
        <div 
          ref={containerRef}
          className="flex space-x-4 py-6 px-6 overflow-x-auto hide-scrollbar relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onScroll={handleScroll}
        >
          {/* Left shadow fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          
          <div 
            className={`flex-shrink-0 cursor-pointer p-4 rounded-xl transition-all ${
              selectedCategory === null ? 'bg-indigo-100 shadow-md scale-105' : 'hover:bg-gray-100 hover:scale-105'
            }`}
            onClick={() => handleCategoryClick(null)}
          >
            <div className="text-center">
              <div className="h-16 w-16 mx-auto bg-indigo-500 rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <span className="text-sm font-medium">Tất cả</span>
            </div>
          </div>
          
          {categories.map((category) => (
            <div
              key={category.id}
              className={`flex-shrink-0 cursor-pointer p-4 rounded-xl transition-all duration-300 transform ${
                selectedCategory === category.id ? 'bg-indigo-100 shadow-md scale-105' : 'hover:bg-gray-100 hover:scale-105'
              }`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="text-center">
                <div className="h-16 w-16 mx-auto rounded-full border border-gray-200 overflow-hidden mb-2">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xl">{category.name.charAt(0)}</span>
                    </div>
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

      {/* Main content area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Flex container for sidebar and products */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Advanced Search Sidebar */}
          <div className="md:w-1/4 lg:w-1/5">
            <AdvancedSearch />
          </div>

          {/* Products Grid with filter count and parallax */}
          <div className="md:w-3/4 lg:w-4/5">
            {/* Filter results count */}
            <p className="text-sm text-gray-500 mb-6">
              {selectedCategory 
                ? `Hiển thị ${filteredProducts.length} sản phẩm trong ${categories.find(c => c.id === selectedCategory)?.name || 'danh mục'}`
                : `Hiển thị tất cả ${filteredProducts.length} sản phẩm`}
            </p>

            {/* Products grid */}
            <div style={parallaxProducts}>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group relative">
                      {/* Product card */}
                      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                        {/* Product image with overlay */}
                        <div className="relative aspect-square overflow-hidden">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                          />
                          
                          {/* Category tag */}
                          <div className="absolute top-4 left-4">
                            <span className="inline-block bg-white/80 px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                              {product.category.name}
                            </span>
                          </div>
                          
                          {/* Quick action buttons */}
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="flex flex-col sm:flex-row gap-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                              <Link
                                href={`/products/${product.id}`}
                                className="bg-white text-gray-800 hover:bg-indigo-50 px-4 py-2 rounded-full shadow-md font-medium text-sm flex items-center"
                              >
                                Xem chi tiết
                              </Link>
                              <button 
                                className="bg-indigo-600 text-white hover:bg-indigo-700 p-2 rounded-full shadow-md flex items-center justify-center"
                                aria-label="Thêm vào giỏ hàng"
                                title="Thêm vào giỏ hàng"
                              >
                                <ShoppingBagIcon className="h-5 w-5" />
                              </button>
                              <button 
                                className="bg-white text-gray-800 hover:bg-pink-50 hover:text-pink-500 p-2 rounded-full shadow-md flex items-center justify-center"
                                aria-label="Thêm vào yêu thích"
                                title="Thêm vào yêu thích"
                              >
                                <HeartIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Product info */}
                        <div className="p-4 flex-grow flex flex-col">
                          <Link href={`/products/${product.id}`} className="flex-grow">
                            <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                          </Link>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-lg font-semibold text-gray-900">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(product.price)}
                            </p>
                            <Link
                              href={`/products/${product.id}`}
                              className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors"
                            >
                              Chi tiết
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
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
          </div>
        </div>
      </div>
    </div>
  );
} 