"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, ShoppingBag, List, Image as ImageIcon, Users, Settings, LogOut, Tag, ClipboardList, ShoppingCart, Flame, Star, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Sản phẩm", href: "/admin/products", icon: ShoppingBag },
  { name: "Đơn hàng", href: "/admin/orders", icon: ShoppingCart },
  { name: "Quản lý kho", href: "/admin/inventory", icon: ClipboardList },
  { name: "Danh mục", href: "/admin/categories", icon: List },
  { name: "Thuộc tính", href: "/admin/products/attributes", icon: Star },
  { name: "Mã giảm giá", href: "/admin/promotions", icon: Tag },
  { name: "Xu hướng", href: "/admin/trends", icon: Flame },
  { name: "Logo", href: "/admin/logo", icon: ImageIcon },
  { name: "Video Background", href: "/admin/videobg", icon: Video },
  { name: "Người dùng", href: "/admin/users", icon: Users },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-[calc(96vh-4rem)] bg-gray-50 backdrop-blur-lg shadow-2xl border-2 border-gray-200 rounded-2xl sticky top-16 z-30 animate-fade-in">
      <nav className="flex-1 py-8 px-4 space-y-2">
        {navItems.map((item) => {
          const active = item.href === '/admin/products' 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
          return (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                  active
                    ? "bg-pink-100 text-pink-600 shadow"
                    : "text-gray-700 hover:bg-gray-100 hover:text-pink-600"
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            </motion.div>
          );
        })}
      </nav>
      <div className="px-4 pb-8">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 hover:text-pink-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
} 