"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalUsers: number;
  totalOrders: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/");
    } else {
      fetchStats();
    }
  }, [session, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Bảng điều khiển</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          href="/admin/products"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Tổng số sản phẩm
          </h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalProducts}</p>
        </Link>

        <Link
          href="/admin/categories"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Tổng số danh mục
          </h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalCategories}</p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Tổng số người dùng
          </h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Tổng số đơn hàng
          </h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalOrders}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quản lý nhanh</h2>
          <div className="space-y-4">
            <Link
              href="/admin/products/new"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Thêm sản phẩm mới
            </Link>
            <Link
              href="/admin/categories/new"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Thêm danh mục mới
            </Link>
            <Link
              href="/admin/users"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Quản lý người dùng
            </Link>
            <Link
              href="/admin/orders"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Quản lý đơn hàng
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Thống kê</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sản phẩm mới hôm nay</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đơn hàng mới hôm nay</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Người dùng mới hôm nay</span>
              <span className="font-semibold">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 