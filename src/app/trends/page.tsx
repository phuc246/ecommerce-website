"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Eye } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Trend {
  id: string;
  name: string;
  image: string;
  productCount: number;
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  category?: { name: string };
  variants?: any[];
  attributes?: any[];
}

export default function TrendExplorePage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [trendProducts, setTrendProducts] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const { data: session } = useSession();

  // Mảng màu gradient cho tên xu hướng
  const gradients = [
    "from-pink-500 via-fuchsia-500 to-pink-600",
    "from-blue-400 via-cyan-400 to-blue-600",
    "from-green-400 via-lime-400 to-green-600",
    "from-yellow-400 via-orange-400 to-pink-500",
    "from-purple-400 via-pink-400 to-red-400",
    "from-indigo-400 via-blue-400 to-indigo-600",
    "from-emerald-400 via-teal-400 to-cyan-600",
  ];

  // Mảng màu nền nổi bật cho section xu hướng
  const sectionBgColors = [
    "bg-gradient-to-br from-pink-100 via-pink-50 to-fuchsia-100",
    "bg-gradient-to-br from-blue-100 via-cyan-50 to-blue-50",
    "bg-gradient-to-br from-green-100 via-lime-50 to-green-50",
    "bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-50",
    "bg-gradient-to-br from-purple-100 via-pink-50 to-red-50",
    "bg-gradient-to-br from-indigo-100 via-blue-50 to-indigo-50",
    "bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-50",
  ];

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      const res = await fetch("/api/trends");
      const data = await res.json();
      setTrends(data);
      setLoading(false);
      // Lấy sản phẩm cho từng trend
      for (const trend of data) {
        const resDetail = await fetch(`/api/trends/${trend.id}`);
        const detail = await resDetail.json();
        if (detail.productIds && detail.productIds.length > 0) {
          const resProducts = await fetch("/api/products/by-ids", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: detail.productIds })
          });
          const products = await resProducts.json();
          setTrendProducts(prev => ({ ...prev, [trend.id]: products }));
        } else {
          setTrendProducts(prev => ({ ...prev, [trend.id]: [] }));
        }
      }
    };
    fetchTrends();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const el = document.getElementById(window.location.hash.replace('#', ''));
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200); // delay để chắc chắn phần tử đã render
      }
    }
  }, []);

  if (loading) {
    return <div className="text-center p-8 text-lg">Đang tải xu hướng...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-fuchsia-50 to-blue-50 py-12 px-2 md:px-8 pt-24">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-600 animate-gradient-x drop-shadow-lg guardian-title">Khám Phá Xu Hướng</h1>
      <div className="flex flex-col gap-24">
        {trends.map((trend, idx) => {
          const sectionBg = sectionBgColors[idx % sectionBgColors.length];
          const gradient = gradients[Math.floor(Math.random() * gradients.length)];
          // Sắp xếp sản phẩm: Nếu flex-row thì mới nhất bên trái, flex-row-reverse thì mới nhất bên phải
          const products = (trendProducts[trend.id] || []).slice();
          if (idx % 2 === 1) {
            products.reverse();
          }
          return (
            <section
              key={trend.id}
              id={`trend-${trend.id}`}
              className={`flex flex-col md:flex-row items-center md:gap-8 gap-4 ${idx % 2 === 1 ? "md:flex-row-reverse" : ""} rounded-2xl shadow-xl p-4 mb-8 ${sectionBg}`}
            >
              {/* Trend info */}
              <div className="w-full max-w-[160px] flex flex-col items-center md:items-start mx-auto">
                <div className="relative w-40 h-40 rounded-2xl overflow-hidden shadow-xl mb-1">
                  <Image src={trend.image} alt={trend.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                </div>
                <h2 className={`text-lg font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${gradient} break-words line-clamp-2 text-center w-full`}>{trend.name}</h2>
              </div>
              {/* Product list */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 px-2 justify-items-center">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="relative min-w-[200px] max-w-[200px] rounded-2xl shadow group snap-start flex flex-col items-stretch transition-transform hover:-translate-y-2 duration-300 bg-transparent p-0 m-0"
                  >
                    <div className="relative w-screen min-w-0 aspect-[1/1.2] rounded-2xl overflow-hidden flex-shrink-0 p-0 m-0 md:min-w-[200px] md:max-w-[200px] md:aspect-[3/4]">
                      <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                      {/* Overlay action buttons on hover */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-opacity duration-300 z-10">
                        <Link href={`/products/${product.id}`} className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-3 shadow transition-colors flex items-center justify-center" title="Xem chi tiết">
                          <Eye size={22} />
                        </Link>
                        <button
                          className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-3 shadow transition-colors flex items-center justify-center"
                          title={isWishlisted(product.id) ? "Bỏ khỏi yêu thích" : "Yêu thích"}
                          onClick={async (e) => {
                            e.preventDefault();
                            if (!session || !session.user) {
                              toast.error('Vui lòng đăng nhập để sử dụng tính năng yêu thích!');
                              return;
                            }
                            try {
                              if (isWishlisted(product.id)) {
                                await removeFromWishlist(product.id);
                              } else {
                                await addToWishlist(product.id);
                              }
                            } catch {}
                          }}
                        >
                          <Heart size={22} className={isWishlisted(product.id) ? 'fill-pink-500 text-pink-500' : ''} />
                        </button>
                      </div>
                    </div>
                    {/* Badge thuộc tính nhỏ dưới card */}
                    {product.attributes && product.attributes.length > 0 && renderAttributeBadges(product.attributes)}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Hiện tất cả thuộc tính (name) dưới dạng badge, tối đa 3, nếu nhiều hơn thì hiện +N
function renderAttributeBadges(attributes: any[] = []) {
  if (!attributes || attributes.length === 0) return null;
  const max = 3;
  const shown = attributes.slice(0, max);
  const extra = attributes.length - max;
  return (
    <div className="w-full px-2 py-2 flex flex-wrap items-center gap-1 justify-center">
      {shown.map(attr => (
        <span key={attr.id} className="text-[10px] bg-pink-100 text-pink-600 rounded-full px-2 py-0.5 font-bold">{attr.name}</span>
      ))}
      {extra > 0 && (
        <span className="text-[10px] bg-pink-100 text-pink-600 rounded-full px-2 py-0.5 font-bold">+{extra}</span>
      )}
    </div>
  );
} 