'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLogo } from '@/hooks/useLogo';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const { items } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { url: logoUrl, isCircular, isLoading: logoLoading, refresh: refreshLogo } = useLogo();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isAuthPage ? 'bg-transparent' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Bên trái: để trống hoặc menu mobile */}
          <div className="flex-1 flex items-center justify-start">
            {!isAuthPage && (
              <div className="sm:hidden flex items-center">
                <button
                  type="button"
                  className={"inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 " + (isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-white hover:text-gray-200')}
                  aria-label="Mở menu điều hướng"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </div>
          {/* Logo ở giữa */}
          <div className="flex-1 flex items-center justify-center">
            <Link href="/" className="flex items-center justify-center group" aria-label="Trang chủ">
              <div className={`relative w-14 h-14 flex items-center justify-center ${isCircular ? 'rounded-full overflow-hidden' : ''} animate-spin-slow`}>
                {!logoLoading && logoUrl && (
                  <Image
                    src={logoUrl}
                    alt="Logo trang chủ"
                    width={56}
                    height={56}
                    className={`transition-all duration-300 ${logoLoading ? 'opacity-0' : 'opacity-100'} ${isCircular ? 'rounded-full' : ''}`}
                    style={{ objectFit: isCircular ? 'cover' : 'contain' }}
                    priority
                    unoptimized={logoUrl.startsWith('data:')}
                  />
                )}
              </div>
            </Link>
          </div>
          {/* Bên phải: đăng nhập hoặc profile */}
          <div className="flex-1 flex items-center justify-end">
            {!isAuthPage && (
              <div className="hidden sm:flex items-center gap-4 ml-4">
                {session?.user ? (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 focus:outline-none">
                          <span className="hidden sm:inline text-sm font-medium">{session.user.name || session.user.email}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {session.user.role === "ADMIN" ? (
                          <>
                            {pathname !== "/admin/dashboard" && (
                              <DropdownMenuItem asChild>
                                <Link href="/admin/dashboard">Trang quản trị</Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => signOut()}>Đăng xuất</DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/profile">Hồ sơ</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/profile/orders">Đơn hàng của tôi</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => signOut()}>Đăng xuất</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.08, boxShadow: '0 0 16px #f472b6' }}
                      whileTap={{ scale: 0.96 }}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 15, delay: 0.2 } }}
                    >
                      <Link
                        href="/login"
                        className="bg-pink-400 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-pink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400"
                        aria-label="Đăng nhập"
                      >
                        Đăng nhập
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Overlay mobile menu giữ nguyên */}
      {!isAuthPage && mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 flex flex-col items-center justify-center gap-8 animate-fade-in sm:hidden">
          <button
            className="absolute top-6 right-6 text-white text-3xl focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu điều hướng"
          >
            <X className="h-8 w-8" />
          </button>
          <Link href="/" className={`text-2xl font-bold ${pathname === '/' ? 'text-indigo-500 underline' : 'text-white hover:text-indigo-400'}`} onClick={() => setMobileMenuOpen(false)}>Trang chủ</Link>
          <Link href="/products" className={`text-2xl font-bold ${pathname === '/products' ? 'text-indigo-500 underline' : 'text-white hover:text-indigo-400'}`} onClick={() => setMobileMenuOpen(false)}>Sản phẩm</Link>
          {!session?.user && (
            <Link href="/login" className="text-2xl font-bold text-white bg-indigo-600 px-6 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>Đăng nhập</Link>
          )}
        </div>
      )}
    </motion.nav>
  );
} 