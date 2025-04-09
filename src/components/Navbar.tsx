'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { items } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logo, setLogo] = useState({
    url: "/images/default-logo.png",
    isCircular: true,
    isLoading: true
  });

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

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch("/api/logo", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          // Add timestamp to prevent caching
          next: { revalidate: 0 }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Loaded logo data:", data);
        
        // Validate the logo URL before using it
        let logoUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNmZjc2YWQiLz4KICA8cGF0aCBkPSJNMzAgNzBMNTAgMzBMNzAgNzBIMzBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K";
        
        if (data.url && typeof data.url === 'string') {
          // Only add timestamp to URLs that are not data URLs
          if (data.url.startsWith('data:image/')) {
            logoUrl = data.url;
          } else {
            logoUrl = `${data.url}?t=${Date.now()}`;
          }
        }
        
        setLogo(prev => ({
          url: logoUrl,
          isCircular: data.isCircular !== undefined ? data.isCircular : true,
          isLoading: false
        }));
      } catch (error) {
        console.error("Error fetching logo:", error);
        // Use an embedded SVG as fallback instead of a path
        setLogo(prev => ({ 
          ...prev, 
          url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNmZjc2YWQiLz4KICA8cGF0aCBkPSJNMzAgNzBMNTAgMzBMNzAgNzBIMzBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
          isLoading: false 
        }));
      }
    };

    fetchLogo();
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-16">
          {/* Left side - empty or admin links */}
          <div className="flex items-center">
            {session?.user?.role === "ADMIN" && (
              <div className="hidden sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className={`${
                    pathname === "/"
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    !isScrolled ? 'text-white hover:text-gray-200 hover:border-gray-200' : ''
                  }`}
                >
                  Trang chủ
                </Link>
                <Link
                  href="/products"
                  className={`${
                    pathname === "/products"
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    !isScrolled ? 'text-white hover:text-gray-200 hover:border-gray-200' : ''
                  }`}
                >
                  Sản phẩm
                </Link>
              </div>
            )}
          </div>
          
          {/* Center - Logo */}
          <div className="absolute inset-x-0 top-0 h-16 flex justify-center items-center pointer-events-none">
            <Link href="/" className="flex items-center justify-center pointer-events-auto">
              <div className={`relative w-14 h-14 flex items-center justify-center ${
                logo.isCircular ? 'rounded-full overflow-hidden logo-spin' : ''
              }`}>
                <Image
                  src={logo.url}
                  alt="Logo"
                  width={56}
                  height={56}
                  className={`transition-all duration-300 ${
                    logo.isLoading ? 'opacity-0' : 'opacity-100'
                  } ${logo.isCircular ? 'rounded-full' : ''}`}
                  style={{ objectFit: logo.isCircular ? 'cover' : 'contain' }}
                  priority
                  unoptimized={logo.url.startsWith('data:')}
                />
              </div>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-white hover:text-gray-200'
              }`}
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
          
          {/* Right side items */}
          <div className="flex items-center z-20">
            <div className="flex items-center">
              <Link
                href="/cart"
                className={`relative p-2 ${
                  isScrolled ? 'text-gray-500 hover:text-gray-700' : 'text-white hover:text-gray-200'
                }`}
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
                      className={`${
                        isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-white hover:text-gray-200'
                      }`}
                    >
                      Quản lý
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className={`${
                      isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-white hover:text-gray-200'
                    }`}
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`${
                      isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-white hover:text-gray-200'
                    } py-2 px-3`}
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

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t">
          <div className="pt-2 pb-3 space-y-1">
            {session?.user?.role === "ADMIN" && (
              <>
                <Link
                  href="/"
                  className={`${
                    pathname === "/"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Trang chủ
                </Link>
                <Link
                  href="/products"
                  className={`${
                    pathname === "/products"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sản phẩm
                </Link>
              </>
            )}
            <Link
              href="/cart"
              className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Giỏ hàng ({items.length})
            </Link>
            
            {session?.user ? (
              <>
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Quản lý
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/login?register=true"
                  className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 