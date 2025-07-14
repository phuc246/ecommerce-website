'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import VideoBackground from "@/components/VideoBackground";
import dynamic from 'next/dynamic';
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ShowcaseProductsGrid from "@/components/home/ShowcaseProductsGrid";
import CartFloatingButton, { WishlistFloatingButton } from "@/components/CartFloatingButton";

// Đã xoá hoàn toàn các import FeaturedProducts, TrendingSection, PromotionBanner, ServicesSection

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [videoHeader, setVideoHeader] = useState("");
  const [videoBackground, setVideoBackground] = useState("");

  useEffect(() => {
    if (status === "loading") return; // Chờ session load xong
    if (session?.user?.role === "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data?.value) {
          const settings = JSON.parse(data.value);
          setVideoHeader(settings.videoHeader || "/videos/vecteezy_3d-pink-cylinder-stage-podium-empty-with-flamingo-palm_37998757.mp4");
          setVideoBackground(settings.videoBackground || "/videos/underwater-light-filters-down-through-blue-ocean-waves_5357500.mp4");
        }
      });
  }, []);

  const FeaturedProducts = dynamic(() => import('@/components/home/FeaturedProducts'), { ssr: false, loading: () => <div>Đang tải sản phẩm nổi bật...</div> });
  const TrendingSection = dynamic(() => import('@/components/home/TrendingSection'), { ssr: false, loading: () => <div>Đang tải xu hướng...</div> });
  const PromotionBanner = dynamic(() => import('@/components/home/PromotionBanner'), { ssr: false, loading: () => <div>Đang tải khuyến mãi...</div> });
  const ServicesSection = dynamic(() => import('@/components/home/ServicesSection'), { ssr: false, loading: () => <div>Đang tải dịch vụ...</div> });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Video Background */}
      <header className="min-h-screen relative">
        <VideoBackground videoSrc={videoHeader} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <motion.h1
            className="text-5xl font-bold mb-6 text-center drop-shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          >
            Chào mừng đến với Doovin
          </motion.h1>
          <motion.p
            className="text-xl mb-8 text-center max-w-2xl px-4 drop-shadow"
            initial={{ x: -40, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
          >
            Khám phá thế giới mua sắm trực tuyến với những sản phẩm chất lượng và giá cả phải chăng
          </motion.p>
          <div className="flex space-x-4">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 15, delay: 1.2 } }}
            >
              <Link
                href="/products"
                className="btn-shine bg-pink-400 text-white hover:bg-pink-500 px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 inline-block text-center"
                aria-label="Xem sản phẩm"
              >
                Xem sản phẩm
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Ocean video background cho Xu Hướng Thời Trang */}
      <div className="relative w-full min-h-[60vh] z-0 overflow-hidden">
        <VideoBackground videoSrc={videoBackground} />
        <section className="py-6 bg-transparent relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div className="container mx-auto px-1">
              <TrendingSection />
            </div>
          </motion.div>
        </section>
      </div>

      <div className="container max-w-full px-0">
        <div className="flex flex-col lg:flex-row gap-8 bg-transparent">
          {/* Main Content */}
          <section className="w-full bg-transparent">
            {/* Promotion Banner */}
            <section className="w-full bg-pink-50 py-4 px-2 md:px-4">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <PromotionBanner />
              </motion.div>
            </section>
            {/* Featured Products Section */}
            <section className="w-full py-4 bg-pink-50 px-2 md:px-4">
              <motion.section
                className="w-full mb-8 min-h-[60vh] py-8 flex flex-col justify-center"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <motion.h2
                  className="text-3xl font-bold mb-8 text-center w-full"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                >
                  Sản Phẩm Nổi Bật
                </motion.h2>
                <FeaturedProducts />
              </motion.section>
            </section>
          </section>
        </div>
      </div>
      {/* Products Link Section */}
      <ShowcaseProductsGrid />
      {/* Services Section dưới cùng */}
      <ServicesSection />
      <CartFloatingButton />
      <WishlistFloatingButton />
    </div>
  );
} 