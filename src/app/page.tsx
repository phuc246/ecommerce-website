'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import VideoBackground from "@/components/VideoBackground";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import TrendingSection from "@/components/home/TrendingSection";
import PromotionBanner from "@/components/home/PromotionBanner";
import AdvancedSearch from "@/components/home/AdvancedSearch";
import { Filter } from "lucide-react";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Video Background */}
      <div className="h-screen relative">
        <VideoBackground videoSrc="/videos/vecteezy_3d-pink-cylinder-stage-podium-empty-with-flamingo-palm_37998757.mp4" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <h1 className="text-5xl font-bold mb-6 text-center">Chào mừng đến với Shop</h1>
          <p className="text-xl mb-8 text-center max-w-2xl px-4">
            Khám phá thế giới mua sắm trực tuyến với những sản phẩm chất lượng và giá cả phải chăng
          </p>
          <div className="flex space-x-4">
            <Link
              href="/products"
              className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Xem sản phẩm
            </Link>
            <Link
              href="/login"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-grow bg-gray-50">
        {/* Trending Section - Now Full Width */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Xu Hướng Thời Trang</h2>
            <TrendingSection />
          </div>
        </section>
        
        {/* Main content container with sidebar and content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar toggle for mobile */}
            <div className="lg:hidden flex justify-start mb-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
                aria-label="Toggle filter sidebar"
              >
                <Filter size={18} />
                <span>Bộ lọc tìm kiếm</span>
              </button>
            </div>
            
            {/* Sidebar */}
            <div className="lg:w-1/4 xl:w-1/5">
              <div className="lg:sticky lg:top-24">
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <h2 className="text-xl font-bold mb-4">Tìm Kiếm Nâng Cao</h2>
                  <AdvancedSearch />
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:w-3/4 xl:w-4/5">
              {/* Promotion Banner */}
              <section className="mb-12">
                <PromotionBanner />
              </section>
              
              {/* Featured Products Section */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-8">Sản Phẩm Nổi Bật</h2>
                <FeaturedProducts />
              </section>
              
              {/* Products Link Section */}
              <section className="mb-12 text-center">
                <h2 className="text-3xl font-bold mb-6">Khám Phá Tất Cả Sản Phẩm</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Chúng tôi có nhiều lựa chọn đa dạng phù hợp với mọi phong cách và nhu cầu
                </p>
                <Link
                  href="/products"
                  className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Xem tất cả sản phẩm
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 