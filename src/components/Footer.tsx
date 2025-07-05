import Link from 'next/link';
import { Facebook, Instagram, Mail, Phone, Info, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="bg-pink-100 text-gray-800 py-5 mt-auto w-full">
      <div className="w-full px-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto px-4">
          <div className="space-y-4">
            <motion.h3
              initial={{ x: -40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2 flex items-center gap-2"
            >
              <Info size={18} className="text-pink-400" /> Về chúng tôi
            </motion.h3>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:underline">Trang chủ</Link></li>
              <li><Link href="/products" className="hover:underline">Sản phẩm</Link></li>
              <li><Link href="/about" className="hover:underline">Giới thiệu</Link></li>
              <li><Link href="/contact" className="hover:underline">Liên hệ</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <motion.h3
              initial={{ x: -40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}
              viewport={{ once: true }}
              className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2 flex items-center gap-2"
            >
              <Mail size={18} className="text-pink-400" /> Liên hệ
            </motion.h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Mail size={16} /> admin@example.com</li>
              <li className="flex items-center gap-2"><Phone size={16} /> 123456</li>
            </ul>
          </div>
          <div className="space-y-4">
            <motion.h3
              initial={{ x: -40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2 flex items-center gap-2"
            >
              <Shield size={18} className="text-pink-400" /> Chính sách
            </motion.h3>
            <ul className="space-y-2">
              <li><Link href="/policy" className="hover:underline">Bảo mật & Điều khoản</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <motion.h3
              initial={{ x: -40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.25 }}
              viewport={{ once: true }}
              className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2 flex items-center gap-2"
            >
              Kết nối
            </motion.h3>
            <div className="flex gap-4 mt-2">
              <a href="#" className="text-gray-500 hover:text-blue-500 transition-colors" aria-label="Facebook"><Facebook size={28} /></a>
              <a href="#" className="text-gray-500 hover:text-pink-500 transition-colors" aria-label="Instagram"><Instagram size={28} /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-300 mt-5 pt-5 text-sm text-gray-500 text-center">
          <p>© {new Date().getFullYear()} Doovin. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 