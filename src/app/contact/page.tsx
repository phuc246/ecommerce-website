"use client";
import { motion } from "framer-motion";
import { FaEnvelope, FaPhoneAlt, FaFacebook, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative py-12 px-4 bg-gradient-to-br from-[#2e1065] via-[#312e81] to-[#f472b6]">
      {/* Overlay tối giúp card nổi bật */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none z-0" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, rotateY: 30 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-3xl glassmorphism-3d rounded-3xl shadow-2xl p-8 md:p-14 flex flex-col md:flex-row gap-10 relative z-10"
        style={{ perspective: 1200 }}
      >
        {/* Left: Info */}
        <motion.div
          className="flex-1 flex flex-col justify-center gap-6 z-10"
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-yellow-400 to-fuchsia-500 bg-clip-text text-transparent mb-2 animate-gradient-x drop-shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Liên hệ Doovin
          </motion.h1>
          <motion.p
            className="text-lg text-gray-700 mb-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Hãy kết nối với chúng tôi để cùng lan tỏa cảm hứng sống đẹp, nhận tư vấn, hợp tác hoặc góp ý xây dựng cộng đồng Doovin!
          </motion.p>
          <div className="flex flex-col gap-3 text-base text-gray-700">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <FaEnvelope className="text-pink-500 text-xl" />
              <span>Email: <a href="mailto:support@doovin.vn" className="text-pink-600 font-bold hover:underline">support@doovin.vn</a></span>
            </motion.div>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.4 }}
            >
              <FaPhoneAlt className="text-yellow-500 text-xl" />
              <span>Hotline: <a href="tel:0987654321" className="text-yellow-600 font-bold hover:underline">0987 654 321</a></span>
            </motion.div>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.4 }}
            >
              <FaMapMarkerAlt className="text-blue-500 text-xl" />
              <span>Văn phòng: 123 Đường Sáng Tạo, Q. Đổi Mới, TP. HCM</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.4 }}
            >
              <FaFacebook className="text-fuchsia-500 text-xl" />
              <a href="https://facebook.com/doovin.vn" target="_blank" rel="noopener" className="font-bold hover:underline">facebook.com/doovin.vn</a>
            </motion.div>
          </div>
        </motion.div>
        {/* Right: Form */}
        <motion.form
          className="flex-1 flex flex-col gap-5 bg-white/60 rounded-2xl p-6 shadow-lg backdrop-blur-md border border-white/30 z-10"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.7, duration: 0.7 }}
          onSubmit={e => { e.preventDefault(); alert('Cảm ơn bạn đã liên hệ Doovin!'); }}
        >
          <motion.h2
            className="text-2xl font-bold text-pink-600 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.4 }}
          >Gửi tin nhắn</motion.h2>
          <motion.input
            type="text"
            placeholder="Họ và tên của bạn"
            required
            className="rounded-lg px-4 py-2 border border-pink-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80 shadow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.0, duration: 0.3 }}
          />
          <motion.input
            type="email"
            placeholder="Email liên hệ"
            required
            className="rounded-lg px-4 py-2 border border-pink-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80 shadow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2, duration: 0.3 }}
          />
          <motion.textarea
            placeholder="Nội dung tin nhắn..."
            required
            rows={4}
            className="rounded-lg px-4 py-2 border border-pink-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80 shadow resize-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.4, duration: 0.3 }}
          />
          <motion.button
            whileHover={{ scale: 1.07, boxShadow: "0 4px 32px #f472b6" }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="mt-2 bg-gradient-to-r from-pink-500 via-yellow-400 to-fuchsia-500 text-white font-bold py-3 rounded-xl shadow-xl flex items-center justify-center gap-2 text-lg drop-shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.7, duration: 0.4 }}
          >
            <FaPaperPlane className="text-xl animate-bounce" />
            Gửi liên hệ
          </motion.button>
        </motion.form>
        {/* Hiệu ứng 3D bóng nổi */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-300/30 rounded-full blur-2xl animate-pulse z-0" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-yellow-200/40 rounded-full blur-2xl animate-pulse z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-fuchsia-300/30 rounded-full blur-2xl animate-pulse z-0" />
      </motion.div>
      {/* Glassmorphism 3D style */}
      <style>{`
        .glassmorphism-3d {
          background: linear-gradient(120deg, rgba(255,255,255,0.85) 60%, rgba(255,255,255,0.6) 100%);
          box-shadow: 0 8px 40px 0 rgba(236,72,153,0.15), 0 1.5px 8px 0 rgba(168,85,247,0.10);
          border: 1.5px solid rgba(236,72,153,0.13);
          backdrop-filter: blur(12px) saturate(1.2);
        }
      `}</style>
    </div>
  );
} 