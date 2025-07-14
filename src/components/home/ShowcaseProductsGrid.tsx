import { useEffect, useState, useRef } from "react";
import ProductCard from "../ProductCard";
import { Loader2, Timer } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import "./ShowcaseProductsGrid.css";
import Link from "next/link";

interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
  order?: number;
  altText?: string;
}
interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  category: { name: string };
  colors?: { name: string; value: string }[];
  description?: string;
  images?: ProductImage[];
  categoryId?: string;
  stock?: number;
  createdAt?: Date;
  updatedAt?: Date;
  sku?: string | null;
}

export default function ShowcaseProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const GRID_SIZE = 16; // 2 rows x 8 columns
  const [highlighted, setHighlighted] = useState(-1);

  // Intersection Observer để phát hiện scroll tới section
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setInView(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đếm ngược khi inView
  useEffect(() => {
    if (!inView || show) return;
    if (countdown === 0) {
      setShow(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [inView, countdown, show]);

  // Fetch sản phẩm khi show
  useEffect(() => {
    if (!show) return;
    setLoading(true);
    fetch("/api/products/shop?limit=18")
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : data.products || []))
      .finally(() => setLoading(false));
  }, [show]);

  // Hiệu ứng đánh sóng: chọn ngẫu nhiên 1 card mỗi 3s
  useEffect(() => {
    if (!products.length) return;
    const interval = setInterval(() => {
      setHighlighted(Math.floor(Math.random() * products.length));
    }, 3000);
    return () => clearInterval(interval);
  }, [products]);

  // Animation variants for staggered columns
  const gridVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col justify-start py-8 bg-pink-50 dark:bg-gray-800">
      {/* Lớp mờ xanh dương biển */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-blue-100 to-blue-50 opacity-80 blur-2xl z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-[480px]">
        <motion.h2
          className="text-4xl font-extrabold mb-4 text-gray-900 drop-shadow-lg text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
        >
          Khám Phá Tất Cả Sản Phẩm
        </motion.h2>
        <p className="text-lg text-gray-700 mb-8 font-medium text-center">Chúng tôi có nhiều lựa chọn đa dạng phù hợp với mọi phong cách và nhu cầu</p>
        <AnimatePresence mode="wait">
          {!show && (
            <motion.div
              key="intro-text"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              className="text-center z-10 px-4"
            >
              <div className="flex flex-col items-center justify-center gap-4 min-h-[240px]">
                <motion.div
                  key={countdown}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto shadow-lg mb-4"
                >
                  <span className="text-3xl font-bold text-pink-600 dark:text-pink-200">{countdown}</span>
                </motion.div>
                <span className="text-base text-pink-200 mt-2">Chờ đã...</span>
              </div>
            </motion.div>
          )}
          {show && (
            <motion.div
              key="product-grid"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={gridVariants}
              className="w-full"
            >
              <div className="grid w-full grid-cols-1 gap-4 px-2 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] justify-items-center">
                {products.slice(0, GRID_SIZE).map((product, idx) => {
                  // Lấy ảnh chính từ images (isMain) hoặc ảnh đầu tiên
                  let mainImage = product.image;
                  if (Array.isArray(product.images) && product.images.length > 0) {
                    const mainObj = product.images.find(img => img.isMain) || product.images[0];
                    if (mainObj?.url) mainImage = mainObj.url;
                  }
                  return (
                    <motion.div
                      key={product.id}
                      className={highlighted === idx ? "relative border-animate w-full min-w-[220px] max-w-[300px] aspect-[3/4]" : "relative w-full min-w-[220px] max-w-[300px] aspect-[3/4]"}
                      variants={cardVariants}
                      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                    >
                      <ProductCard 
                        product={{
                          ...product,
                          image: mainImage,
                          description: product.description || '',
                          categoryId: product.categoryId || '',
                          createdAt: product.createdAt || new Date(),
                          updatedAt: product.updatedAt || new Date(),
                          salePrice: product.salePrice ?? null,
                          sku: product.sku ?? null,
                        }}
                        hideName={true}
                      />
                    </motion.div>
                  );
                })}
                {/* Fill remaining slots with placeholders if less than GRID_SIZE products */}
                {Array.from({ length: Math.max(0, GRID_SIZE - products.length) }).map((_, i) => (
                  <div key={`placeholder-${i}`}></div>
                ))}
              </div>
              {/* Nút Xem tất cả sản phẩm ngay dưới lưới */}
              <div className="mt-8 flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
                  className="overflow-hidden rounded-lg"
                >
                  <Link href="/products" className="btn-shine inline-block bg-pink-400 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-pink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400">
                    Xem tất cả sản phẩm
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
} 