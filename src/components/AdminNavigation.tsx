"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function AdminNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin/dashboard" className="text-xl font-bold text-gray-900">
              E-Commerce Admin
            </Link>
            <Link
              href="/admin/dashboard"
              className={`${
                pathname === "/admin/dashboard"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } text-sm font-medium`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className={`${
                pathname === "/admin/products"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } text-sm font-medium`}
            >
              Sản phẩm
            </Link>
            <Link
              href="/admin/categories"
              className={`${
                pathname === "/admin/categories"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } text-sm font-medium`}
            >
              Danh mục
            </Link>
            <Link
              href="/admin/logo"
              className={`${
                pathname === "/admin/logo"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } text-sm font-medium`}
            >
              Logo
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <UserCircleIcon className="h-6 w-6" />
                <span className="text-sm font-medium">{session?.user?.email}</span>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link
                    href="/"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Về trang chủ
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 