import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback } from 'react';
import './ShowcaseProductsGrid.css';

const ServicesSection = () => {
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState(0);
  const [showNotify, setShowNotify] = useState(false);

  // Preload ảnh dịch vụ NGAY KHI MOUNT
  useEffect(() => {
    const serviceImages = [
      '/service/Quà Doovin.png',
      '/service/Vali Doovin Dán Sticker.png',
    ];
    serviceImages.forEach(src => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  // Trigger inView khi scroll tới 50% section
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      // Kiểm tra nếu 50% section đã vào viewport
      const threshold = 0.5;
      const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
      const sectionHeight = rect.height;
      if (visibleHeight / sectionHeight >= threshold && rect.top < windowHeight && rect.bottom > 0) {
        setInView(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đếm ngược và showContent chỉ khi inView
  useEffect(() => {
    if (!inView || showContent) return;
    // Timer to switch view after 3s
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 3000);

    // Countdown logic, only runs when intro is visible
    if (!showContent) {
      const countdownInterval = setInterval(() => {
        setCountdown(prev => (prev > 1 ? prev - 1 : 0));
      }, 1000);

      // Clean up interval when component unmounts or content is shown
      return () => {
        clearInterval(countdownInterval);
        clearTimeout(contentTimer);
      };
    }
    // Clean up the main timer
    return () => clearTimeout(contentTimer);
  }, [inView, showContent]);

  // Hiệu ứng border động cho 2 ảnh dịch vụ
  useEffect(() => {
    if (!showContent) return;
    const interval = setInterval(() => {
      setHighlighted(idx => (idx + 1) % 2);
    }, 3000);
    return () => clearInterval(interval);
  }, [showContent]);

  // Tự động đóng form sau 2.5s
  useEffect(() => {
    if (showNotify) {
      const t = setTimeout(() => setShowNotify(false), 2500);
      return () => clearTimeout(t);
    }
  }, [showNotify]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col items-center justify-start pt-8 pb-16 bg-pink-50 dark:bg-gray-800 overflow-hidden">
      {/* Pink blur effect background */}
      <div className="absolute inset-0 bg-pink-200/30 dark:bg-pink-900/30 filter blur-3xl" aria-hidden="true"></div>
      <AnimatePresence mode="wait">
        {showNotify ? (
          <div key="notify" className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white/90 border border-pink-200 shadow-xl rounded-xl px-8 py-4 text-lg font-semibold text-pink-600 flex items-center gap-2 notify-popup">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f472b6" opacity=".15"/><path d="M12 8v4" stroke="#f472b6" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="#f472b6"/></svg>
            Chức năng này đang được hoàn thiện, hãy cùng đón chờ nhé!
            <button onClick={() => setShowNotify(false)} className="ml-4 px-3 py-1 rounded bg-pink-100 text-pink-600 font-bold hover:bg-pink-200 transition">Đóng</button>
          </div>
        ) : !showContent ? (
          <motion.div key="intro-text"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            viewport={{ once: true, amount: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center z-10 px-4"
          >
            <h2 className="text-4xl font-extrabold text-pink-500 dark:text-pink-300 drop-shadow-lg text-center mb-6 mt-0">
              Dịch vụ của Doovin
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-700 dark:text-gray-300">
              Doovin cung cấp dịch vụ gói quà cho tất cả đơn hàng, được đóng gói một cách cẩn thận trong chiếc hộp biểu tượng của thương hiệu.
            </p>
            {/* Countdown Timer */}
            <div className="mt-8">
              <motion.div
                key={countdown} // Animate on number change
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto shadow-lg"
              >
                <span className="text-3xl font-bold text-pink-600 dark:text-pink-200">{countdown}</span>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="service-content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="w-full max-w-6xl z-10"
          >
            <motion.h2
              className="text-4xl font-extrabold text-pink-500 dark:text-pink-300 drop-shadow-lg text-center mb-6 mt-0"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.08, 1], opacity: 1 }}
              transition={{ duration: 1.2, type: 'tween', repeat: Infinity, repeatType: 'reverse', repeatDelay: 1 }}
            >
              Dịch Vụ
            </motion.h2>
            <motion.div
              key="service-images"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-6xl z-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Ảnh 1 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-11/12 rounded-2xl overflow-hidden bg-white/50 dark:bg-gray-700/50 shadow-2xl backdrop-blur-sm border-animate">
                    <Image
                      src="/service/Quà Doovin.png"
                      alt="Nghệ thuật tặng quà"
                      width={700}
                      height={500}
                      className="w-full h-auto object-contain"
                      priority
                    />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Nghệ thuật tặng quà</h3>
                  <div className="mt-2 flex space-x-4">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <button
                        onClick={() => setShowNotify(true)}
                        className="btn-underline text-base font-medium text-pink-500 dark:text-pink-300 transition-colors focus:outline-none"
                        type="button"
                      >
                        Quà tặng cho nữ
                      </button>
                    </motion.div>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <button
                        onClick={() => setShowNotify(true)}
                        className="btn-underline text-base font-medium text-pink-500 dark:text-pink-300 transition-colors focus:outline-none"
                        type="button"
                      >
                        Quà tặng cho nam
                      </button>
                    </motion.div>
                  </div>
                </div>
                {/* Ảnh 2 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-11/12 rounded-2xl overflow-hidden bg-white/50 dark:bg-gray-700/50 shadow-2xl backdrop-blur-sm border-animate">
                    <Image
                      src="/service/Vali Doovin Dán Sticker.png"
                      alt="Dịch vụ cá nhân hóa"
                      width={700}
                      height={500}
                      className="w-full h-auto object-contain"
                      priority
                    />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Dịch vụ cá nhân hóa</h3>
                  <div className="mt-2">
                    <motion.button
                      className="btn-underline text-base font-medium text-pink-500 dark:text-pink-300 transition-colors focus:outline-none"
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      onClick={() => setShowNotify(true)}
                      type="button"
                    >
                      Khám phá
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ServicesSection;
