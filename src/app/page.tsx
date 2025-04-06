import Link from "next/link";
import VideoBackground from "@/components/VideoBackground";

export default function Home() {
  return (
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
  );
} 