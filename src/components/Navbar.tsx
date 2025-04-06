'use client';

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { items } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Shop
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
              {session?.user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`${
                    pathname.startsWith("/admin")
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Quản lý
                </Link>
              )}
            </div>
          </div>
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
            {session ? (
              <div className="ml-4 flex items-center">
                <span className="text-sm text-gray-700 mr-4">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="ml-4 flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/login?register=true"
                  className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 