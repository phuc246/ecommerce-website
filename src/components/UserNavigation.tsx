"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCartIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function UserNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut({ callbackUrl: "/" });
      toast.success("Đã đăng xuất thành công");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Đăng xuất thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              E-Commerce
            </Link>
            <Link
              href="/"
              className={`${
                pathname === "/"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } text-sm font-medium`}
            >
              Trang chủ
            </Link>
            <Link
              href="/products"
              className={`${
                pathname === "/products"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } text-sm font-medium`}
            >
              Sản phẩm
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-gray-900"
            >
              <ShoppingCartIcon className="h-6 w-6" />
            </Link>
            {session ? (
              <>
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="text-gray-700 hover:text-gray-900 text-sm font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      Đang đăng xuất...
                    </div>
                  ) : (
                    "Đăng xuất"
                  )}
                </button>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                >
                  {session.user?.name || session.user?.email}
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/register"
                  className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                >
                  Đăng ký
                </Link>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 