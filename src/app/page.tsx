import Link from "next/link";
import Image from "next/image";
import VideoBackground from "@/components/VideoBackground";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import TrendingSection from "@/components/home/TrendingSection";
import PromotionBanner from "@/components/home/PromotionBanner";
import AdvancedSearch from "@/components/home/AdvancedSearch";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Video Background */}
      <div className="h-[70vh] relative">
        <VideoBackground videoSrc="/videos/vecteezy_3d-pink-cylinder-stage-podium-empty-with-flamingo-palm_37998757.mp4">
          <div className="flex flex-col items-center justify-center h-full text-white">
            <h1 className="text-5xl font-bold mb-6">Chào mừng đến với Shop</h1>
            <p className="text-xl mb-8 text-center max-w-2xl">
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
        </VideoBackground>
      </div>

      <main className="flex-grow bg-gray-50">
        {/* Featured Products Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Sản Phẩm Nổi Bật</h2>
            <FeaturedProducts />
          </div>
        </section>

        {/* Advanced Search Section */}
        <section className="py-10 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Tìm Kiếm Nâng Cao</h2>
            <AdvancedSearch />
          </div>
        </section>
        
        {/* Promotion Banner */}
        <section className="py-12">
          <PromotionBanner />
        </section>

        {/* Trending Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Xu Hướng Thời Trang</h2>
            <TrendingSection />
          </div>
        </section>
      </main>
    </div>
  );
} 