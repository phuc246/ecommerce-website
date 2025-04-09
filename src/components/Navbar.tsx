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
  const [logo, setLogo] = useState({
    url: "/images/default-logo.png",
    isCircular: true,
    isLoading: true
  });

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch("/api/logo", {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setLogo(prev => ({
          url: data.url || prev.url,
          isCircular: data.isCircular,
          isLoading: false
        }));
      } catch (error) {
        console.error("Error fetching logo:", error);
        setLogo(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchLogo();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <div className={`relative w-12 h-12 flex items-center justify-center ${
                  logo.isCircular ? 'rounded-full overflow-hidden' : ''
                }`}>
                  <Image
                    src={logo.url}
                    alt="Logo"
                    width={48}
                    height={48}
                    className={`transition-opacity duration-300 ${
                      logo.isLoading ? 'opacity-0' : 'opacity-100'
                    } ${logo.isCircular ? 'rounded-full' : ''}`}
                    style={{ objectFit: logo.isCircular ? 'cover' : 'contain' }}
                    priority
                    onError={() => {
                      setLogo(prev => ({
                        ...prev,
                        url: "/images/default-logo.png"
                      }));
                    }}
                  />
                </div>
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