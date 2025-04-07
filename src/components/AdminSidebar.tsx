"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ChartBarIcon,
  TagIcon,
  ShoppingBagIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  PhotoIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: ChartBarIcon,
  },
  {
    name: "Quản lý sản phẩm",
    href: "/admin/products",
    icon: ShoppingBagIcon,
    children: [
      {
        name: "Danh sách sản phẩm",
        href: "/admin/products/list",
      },
      {
        name: "Danh mục",
        href: "/admin/products/categories",
      },
      {
        name: "Thuộc tính",
        href: "/admin/products/attributes",
      },
    ],
  },
  {
    name: "Quản lý người dùng",
    href: "/admin/users",
    icon: UsersIcon,
  },
  {
    name: "Quản lý logo",
    href: "/admin/logo",
    icon: PhotoIcon,
  },
  {
    name: "Quản lý footer",
    href: "/admin/footer",
    icon: NewspaperIcon,
  },
  {
    name: "Cài đặt",
    href: "/admin/settings",
    icon: Cog6ToothIcon,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const isActive = (href: string) => {
    if (href === "/admin/products") {
      return pathname.startsWith(href);
    }
    return pathname === href;
  };

  const isChildActive = (href: string) => pathname === href;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <>
                  <div
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${
                        isActive(item.href)
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-6 w-6 flex-shrink-0
                        ${
                          isActive(item.href)
                            ? "text-gray-500"
                            : "text-gray-400 group-hover:text-gray-500"
                        }
                      `}
                      aria-hidden="true"
                    />
                    {item.name}
                  </div>
                  <div className="space-y-1 pl-11">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`
                          group flex items-center px-2 py-2 text-sm font-medium rounded-md
                          ${
                            isChildActive(child.href)
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }
                        `}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${
                      isActive(item.href)
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 h-6 w-6 flex-shrink-0
                      ${
                        isActive(item.href)
                          ? "text-gray-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
        <button
          onClick={handleSignOut}
          className="group -mx-2 flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeftOnRectangleIcon
            className="h-6 w-6 text-gray-400 group-hover:text-gray-500"
            aria-hidden="true"
          />
          Đăng xuất
        </button>
      </div>
    </div>
  );
} 