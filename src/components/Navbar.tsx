'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { items } = useCart();
  const [logoUrl, setLogoUrl] = useState("/images/logo.png");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDefaultLogo, setIsDefaultLogo] = useState(true);
  const [isCircularLogo, setIsCircularLogo] = useState(true);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const response = await fetch("/api/logo");
      if (!response.ok) throw new Error("Failed to fetch logo");
      const data = await response.json();
      if (data && data.url) {
        setLogoUrl(data.url);
        setIsDefaultLogo(data.isDefault || false);
        setIsCircularLogo(data.isCircular !== undefined ? data.isCircular : true);
      }
    } catch (error) {
      console.error("Không thể tải logo:", error);
      setHasError(true);
      setIsDefaultLogo(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    console.log("Lỗi khi tải hình ảnh logo");
    setHasError(true);
    setLogoUrl("/images/logo.png");
    setIsDefaultLogo(true);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold">e-commerce</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`${
                  pathname === "/"
                    ? "border-indigo-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Trang chủ
              </Link>
              <Link
                href="/products"
                className={`${
                  pathname === "/products"
                    ? "border-indigo-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Sản phẩm
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center">
              {!hasError && !isDefaultLogo && (
                <div className={`relative w-10 h-10 mr-4 ${isCircularLogo ? 'rounded-full overflow-hidden' : ''}`}>
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    fill
                    className={isCircularLogo ? 'rounded-full' : ''}
                    style={{ objectFit: isCircularLogo ? 'cover' : 'contain' }}
                    onError={handleImageError}
                    sizes="40px"
                    priority
                  />
                </div>
              )}
              <Link
                href="/cart"
                className="relative p-2 text-gray-500 hover:text-gray-700"
              >
                <ShoppingCart className="h-6 w-6" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>
            </div>
            <div className="flex items-center gap-4 ml-4">
              {session?.user ? (
                <>
                  {session.user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="text-gray-700 hover:text-gray-900"
                    >
                      Quản lý
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/login?register=true"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 