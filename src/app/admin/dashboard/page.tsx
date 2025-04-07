"use client";

import { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats_cards = [
    {
      name: "Doanh thu",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(stats.totalRevenue),
      icon: CurrencyDollarIcon,
      change: "+4.75%",
      changeType: "positive",
    },
    {
      name: "Đơn hàng",
      value: stats.totalOrders,
      icon: ShoppingBagIcon,
      change: "+54.02%",
      changeType: "positive",
    },
    {
      name: "Người dùng",
      value: stats.totalUsers,
      icon: UserGroupIcon,
      change: "+6.38%",
      changeType: "positive",
    },
    {
      name: "Sản phẩm",
      value: stats.totalProducts,
      icon: ChartBarIcon,
      change: "+11.25%",
      changeType: "positive",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-700">
        Tổng quan về hoạt động của cửa hàng
      </p>

      <div className="mt-6">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats_cards.map((item) => (
            <div
              key={item.name}
              className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
            >
              <dt>
                <div className="absolute rounded-md bg-indigo-500 p-3">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                  {item.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">
                  {item.value}
                </p>
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    item.changeType === "positive"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {item.change}
                </p>
                <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a
                      href="#"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Xem chi tiết
                      <span className="sr-only"> {item.name} stats</span>
                    </a>
                  </div>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Add more dashboard components here */}
    </div>
  );
} 