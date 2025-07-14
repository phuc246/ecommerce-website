"use client";
import { FaRocket, FaUsers, FaHeart, FaHandshake, FaPhoneAlt } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-blue-50 py-12 px-4 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white/90 rounded-3xl shadow-2xl p-8 md:p-14 mt-8">
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-pink-500 via-yellow-400 to-fuchsia-500 bg-clip-text text-transparent mb-6 animate-gradient-x"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0 }}
        >
          Về <span className="text-pink-500">Doovin</span>
        </motion.h1>
        <motion.p
          className="text-lg text-gray-700 text-center mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          Doovin không chỉ là một sàn thương mại điện tử, mà là nơi kết nối đam mê, sáng tạo và phong cách sống hiện đại. Chúng tôi mang đến trải nghiệm mua sắm <span className="font-bold text-pink-500">cá nhân hóa</span>, <span className="font-bold text-yellow-500">an toàn</span> và <span className="font-bold text-fuchsia-500">truyền cảm hứng</span> cho hàng triệu khách hàng Việt Nam.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {[{
            icon: <FaRocket className="text-4xl text-pink-400 mb-2 animate-bounce" />,
            title: "Sứ mệnh",
            desc: "Thúc đẩy sự phát triển của thương hiệu Việt, lan tỏa giá trị sáng tạo và nâng tầm trải nghiệm mua sắm số."
          }, {
            icon: <FaUsers className="text-4xl text-yellow-400 mb-2 animate-pulse" />,
            title: "Đội ngũ",
            desc: "Quy tụ những con người trẻ trung, nhiệt huyết, dám nghĩ lớn và luôn đặt khách hàng làm trung tâm của mọi hành động."
          }, {
            icon: <FaHeart className="text-4xl text-fuchsia-400 mb-2 animate-pulse" />,
            title: "Giá trị cốt lõi",
            desc: <ul className="text-gray-600 list-disc list-inside text-left">
              <li>Chân thành &amp; Tử tế</li>
              <li>Đổi mới không ngừng</li>
              <li>Đồng hành cùng khách hàng</li>
              <li>Lan tỏa cảm hứng sống đẹp</li>
            </ul>
          }, {
            icon: <FaHandshake className="text-4xl text-blue-400 mb-2 animate-bounce" />,
            title: "Cam kết",
            desc: "Sản phẩm chính hãng, dịch vụ tận tâm, bảo vệ quyền lợi khách hàng và đồng hành cùng cộng đồng."
          }].map((item, idx) => (
            <motion.div
              key={item.title}
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 + idx * 0.2 }}
            >
              {item.icon}
              <h2 className="text-xl font-bold mb-1">{item.title}</h2>
              <div className="text-gray-600">{item.desc}</div>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="bg-gradient-to-r from-pink-100 via-yellow-100 to-blue-100 rounded-2xl p-6 shadow-inner flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3 }}
        >
          <h3 className="text-2xl font-bold text-pink-600 mb-2">Câu chuyện Doovin</h3>
          <p className="text-gray-700 text-center max-w-2xl">
            Khởi nguồn từ một nhóm bạn trẻ yêu công nghệ và thời trang, Doovin ra đời với khát vọng tạo nên một hệ sinh thái mua sắm <span className="font-semibold text-pink-500">"vui - tiện - chất"</span>. Chúng tôi tin rằng mỗi sản phẩm đều mang một câu chuyện, mỗi khách hàng đều xứng đáng được truyền cảm hứng và phục vụ bằng cả trái tim.
          </p>
        </motion.div>
        {/* Timeline Story Branding */}
        <motion.div
          className="max-w-2xl mx-auto mt-12 mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center text-fuchsia-600 mb-6">Hành trình phát triển</h2>
          <div className="relative">
            {[
              {
                year: '06/2022',
                title: 'Khởi đầu giản dị',
                desc: 'Một nhóm bạn trẻ cùng chung đam mê thời trang và mong muốn tạo ra không gian mua sắm thân thiện, gần gũi.',
                icon: <FaRocket className="text-pink-400 text-2xl md:text-3xl" />,
                color: 'from-pink-400 via-yellow-300 to-fuchsia-400'
              },
              {
                year: '12/2022',
                title: 'Những đơn hàng đầu tiên',
                desc: 'Doovin nhận được những đơn hàng đầu tiên, từng gói hàng được đóng gói bằng cả sự háo hức và tận tâm.',
                icon: <FaUsers className="text-yellow-400 text-2xl md:text-3xl" />,
                color: 'from-yellow-400 via-pink-300 to-fuchsia-400'
              },
              {
                year: '2023',
                title: 'Lan tỏa niềm vui',
                desc: 'Khách hàng bắt đầu chia sẻ trải nghiệm tích cực, Doovin trở thành nơi kết nối những người yêu phong cách sống đẹp.',
                icon: <FaHeart className="text-fuchsia-400 text-2xl md:text-3xl" />,
                color: 'from-fuchsia-400 via-pink-300 to-yellow-400'
              },
              {
                year: '2024',
                title: 'Cộng đồng lớn mạnh',
                desc: 'Tổ chức các sự kiện offline, workshop, minigame, gắn kết khách hàng và thương hiệu như những người bạn.',
                icon: <FaHandshake className="text-blue-400 text-2xl md:text-3xl" />,
                color: 'from-blue-400 via-pink-300 to-yellow-400'
              },
              {
                year: '2025',
                title: 'Không ngừng sẻ chia',
                desc: 'Doovin đồng hành cùng các hoạt động thiện nguyện, lan tỏa giá trị sống tích cực đến cộng đồng.',
                icon: <FaHeart className="text-pink-400 text-2xl md:text-3xl" />,
                color: 'from-pink-400 via-yellow-300 to-fuchsia-400'
              },
            ].map((m, idx, arr) => {
              const isLeft = idx % 2 === 0;
              return (
                <motion.div
                  key={m.year}
                  className={`flex flex-col md:flex-row items-center mb-12 relative ${isLeft ? "md:justify-start" : "md:justify-end"}`}
                  initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.7, delay: 2.2 + idx * 0.2 }}
                >
                  {/* Left side (for zigzag) */}
                  {isLeft && (
                    <div className="md:w-1/2 justify-end pr-4 hidden md:flex">
                      <div className="max-w-xs text-right">
                        <div className="text-lg font-bold text-pink-600 mb-1">{m.title}</div>
                        <div className="text-gray-700 text-base">{m.desc}</div>
                      </div>
                    </div>
                  )}
                  {/* Timeline line & dot */}
                  <div className="flex flex-col items-center z-10">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white font-extrabold text-xl md:text-2xl shadow-xl border-4 border-white animate-bounce mb-2 relative`}>
                      <span className="absolute top-1 left-1">{m.icon}</span>
                      <span className="drop-shadow-lg text-[#c026d3]">{m.year}</span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="h-16 w-1 bg-pink-200 animate-pulse" />
                    )}
                  </div>
                  {/* Right side (for zigzag) */}
                  {!isLeft && (
                    <div className="md:w-1/2 justify-start pl-4 hidden md:flex">
                      <div className="max-w-xs text-left">
                        <div className="text-lg font-bold text-pink-600 mb-1">{m.title}</div>
                        <div className="text-gray-700 text-base">{m.desc}</div>
                      </div>
                    </div>
                  )}
                  {/* Mobile: always show below dot */}
                  <div className="md:hidden mt-2 text-center max-w-xs">
                    <div className="text-lg font-bold text-pink-600 mb-1">{m.title}</div>
                    <div className="text-gray-700 text-base">{m.desc}</div>
                  </div>
                </motion.div>
              );
            })}
            {/* Vertical line center for zigzag */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-pink-100 -translate-x-1/2 z-0" />
          </div>
        </motion.div>
        {/* Đối tác - Saas style */}
        <motion.div
          className="max-w-2xl mx-auto mt-16 mb-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-500 mb-6">Đối tác của Doovin</h2>
          <div className="flex flex-wrap justify-center gap-8 glassmorphism-3d p-6 rounded-2xl shadow-lg">
            {[
              { name: 'Viettel Post', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-Viettel-Post-Red.png' },
              { name: 'Giao Hàng Nhanh', logo: 'https://careerhub.huflit.edu.vn/wp-content/uploads/2024/12/Logo-GHN.jpg' },
              { name: 'ZaloPay', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTlp4qW2M8xPofmuZHwEfGi9mNMWUG0zs53A&s' },
              { name: 'MoMo', logo: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png' },
              { name: 'Shopee', logo: 'https://rubee.com.vn/admin/webroot/upload/image//images/tin-tuc/Shopee-logo-1.jpg' },
            ].map((p, idx) => (
              <motion.div
                key={p.name}
                className="flex flex-col items-center gap-2 bg-white/60 rounded-xl px-6 py-4 shadow-md backdrop-blur-md border border-white/30 hover:scale-105 transition-transform"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
              >
                <img src={p.logo} alt={p.name} className="h-12 w-auto object-contain mb-1" />
                <span className="text-sm font-semibold text-gray-700">{p.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        {/* Khách hàng nói gì về chúng tôi - Testimonial Saas style */}
        <motion.div
          className="max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center text-fuchsia-600 mb-6">Khách hàng nói gì về chúng tôi?</h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            {[
              {
                name: 'Nguyễn Minh Châu',
                avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
                content: 'Dịch vụ cực kỳ tận tâm, sản phẩm chất lượng và đóng gói rất đẹp. Mình cảm thấy được trân trọng như một người bạn thực sự!',
                company: 'Khách hàng thân thiết'
              },
              {
                name: 'Trần Quốc Huy',
                avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                content: 'Mình rất thích trải nghiệm mua sắm tại Doovin, giao hàng nhanh, nhiều ưu đãi và đội ngũ hỗ trợ rất nhiệt tình.',
                company: 'Khách hàng doanh nghiệp'
              },
              {
                name: 'Lê Thị Mai',
                avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
                content: 'Không gian mua sắm sáng tạo, nhiều sản phẩm độc đáo, mình sẽ giới thiệu cho bạn bè!',
                company: 'Khách hàng cá nhân'
              },
            ].map((c, idx) => (
              <motion.div
                key={c.name}
                className="flex-1 bg-white/70 rounded-2xl p-6 shadow-lg glassmorphism-3d flex flex-col items-center gap-3 border border-white/30 hover:scale-105 transition-transform"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + idx * 0.15, duration: 0.5 }}
              >
                <img src={c.avatar} alt={c.name} className="w-16 h-16 rounded-full border-4 border-pink-200 shadow-md mb-2" />
                <div className="text-base text-gray-700 text-center italic">“{c.content}”</div>
                <div className="font-bold text-pink-600 mt-2">{c.name}</div>
                <div className="text-xs text-gray-500">{c.company}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div
          className="flex flex-col items-center gap-2 mt-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.6 }}
        >
          <div className="flex items-center gap-2 text-lg text-gray-700">
            <FaPhoneAlt className="text-pink-400" />
            <span>Liên hệ: </span>
            <a href="mailto:support@doovin.vn" className="text-pink-600 font-bold hover:underline">support@doovin.vn</a>
          </div>
          <Link href="/" className="mt-4 inline-block bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-full shadow transition">Quay về trang chủ</Link>
        </motion.div>
      </div>
    </div>
  );
} 