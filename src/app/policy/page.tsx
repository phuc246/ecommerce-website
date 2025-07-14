"use client";
import { motion } from "framer-motion";
import { FaShieldAlt, FaUndo, FaTruck, FaLock, FaUserCheck, FaRegSmile } from "react-icons/fa";

export default function PolicyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative py-12 px-4 bg-gradient-to-br from-[#43cea2] via-[#185a9d] to-[#a770ef]">
      <div className="absolute inset-0 bg-black/30 pointer-events-none z-0" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-3xl glassmorphism-3d rounded-3xl shadow-2xl p-8 md:p-14 flex flex-col gap-10 relative z-10"
      >
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-pink-500 via-yellow-400 to-fuchsia-500 bg-clip-text text-transparent mb-4 animate-gradient-x drop-shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Chính sách & Cam kết của Doovin
        </motion.h1>
        <motion.p
          className="text-lg text-gray-700 text-center mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Chúng tôi cam kết mang đến trải nghiệm mua sắm an toàn, minh bạch và tận tâm như các sàn thương mại điện tử hàng đầu. Chính sách rõ ràng, bảo vệ quyền lợi khách hàng tối đa, tạo dựng sự tin tưởng tuyệt đối.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chính sách nổi bật */}
          {[
            {
              icon: (
                <motion.span
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <FaShieldAlt className="text-3xl text-pink-500 mb-2" />
                </motion.span>
              ),
              title: "Bảo vệ quyền lợi khách hàng",
              desc: "Mọi đơn hàng đều được kiểm tra, xác nhận và bảo vệ quyền lợi tối đa. Cam kết hoàn tiền 100% nếu phát hiện hàng giả, hàng nhái."
            },
            {
              icon: (
                <motion.span
                  animate={{ rotate: [0, -360, -360] }}
                  transition={{ repeat: Infinity, duration: 2.2, repeatDelay: 1.2, ease: "linear" }}
                  className="inline-block"
                >
                  <FaUndo className="text-3xl text-yellow-500 mb-2" />
                </motion.span>
              ),
              title: "Đổi trả linh hoạt 7-30 ngày",
              desc: "Hỗ trợ đổi trả miễn phí trong 7 ngày với sản phẩm lỗi, đổi size, không vừa ý. Một số sản phẩm đặc biệt áp dụng đổi trả 30 ngày."
            },
            {
              icon: (
                <motion.span
                  animate={{ x: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <FaTruck className="text-3xl text-blue-500 mb-2" />
                </motion.span>
              ),
              title: "Giao hàng nhanh & bảo hiểm",
              desc: "Liên kết các đơn vị vận chuyển lớn, giao hàng toàn quốc, bảo hiểm 100% giá trị đơn hàng, hỗ trợ kiểm tra khi nhận."
            },
            {
              icon: (
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <FaLock className="text-3xl text-fuchsia-500 mb-2" />
                </motion.span>
              ),
              title: "Bảo mật thông tin tuyệt đối",
              desc: "Áp dụng công nghệ Saas, mã hóa dữ liệu, không chia sẻ thông tin cá nhân cho bên thứ ba. Chính sách bảo mật chuẩn quốc tế."
            },
            {
              icon: (
                <motion.span
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.3 }}
                  className="inline-block"
                >
                  <FaUserCheck className="text-3xl text-green-500 mb-2" />
                </motion.span>
              ),
              title: "Hỗ trợ tận tâm 24/7",
              desc: "Đội ngũ CSKH chuyên nghiệp, hỗ trợ đa kênh (chat, hotline, email, mạng xã hội) bất cứ lúc nào bạn cần."
            },
            {
              icon: (
                <motion.span
                  animate={{ rotate: [-10, 10, -10] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <FaRegSmile className="text-3xl text-yellow-400 mb-2" />
                </motion.span>
              ),
              title: "Ưu đãi & quyền lợi thành viên",
              desc: "Tích điểm, nhận voucher, ưu đãi sinh nhật, hoàn tiền, tham gia cộng đồng Doovin Member với nhiều đặc quyền hấp dẫn."
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              className="flex flex-col items-center text-center bg-white/70 rounded-2xl p-6 shadow-lg glassmorphism-3d border border-white/30 hover:scale-105 transition-transform"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + idx * 0.15, duration: 0.5 }}
            >
              {item.icon}
              <div className="text-lg font-bold text-pink-600 mb-1">{item.title}</div>
              <div className="text-gray-700 text-base">{item.desc}</div>
            </motion.div>
          ))}
        </div>
        {/* Cam kết & sự tin dùng */}
        <motion.div
          className="mt-10 bg-gradient-to-r from-pink-100/80 via-yellow-100/70 to-blue-100/80 rounded-2xl p-6 shadow-inner flex flex-col items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.7, duration: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-fuchsia-600 mb-2">Sự tin dùng của hàng triệu khách hàng</h2>
          <p className="text-gray-700 text-center max-w-2xl mb-2">
            Doovin tự hào là lựa chọn của hàng triệu khách hàng trên toàn quốc, từ cá nhân, gia đình đến doanh nghiệp. Chúng tôi không ngừng đổi mới, ứng dụng công nghệ Saas để nâng cao trải nghiệm, bảo vệ quyền lợi và mang lại giá trị bền vững cho cộng đồng.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-4">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-pink-500">99.8%</span>
              <span className="text-xs text-gray-500">Khách hàng hài lòng</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-yellow-500">24/7</span>
              <span className="text-xs text-gray-500">Hỗ trợ mọi lúc</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-blue-500">+2 triệu</span>
              <span className="text-xs text-gray-500">Đơn hàng thành công</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-fuchsia-500">100%</span>
              <span className="text-xs text-gray-500">Bảo mật & hoàn tiền</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
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