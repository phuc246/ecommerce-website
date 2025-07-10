"use client";

import { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6366f1", "#f472b6", "#34d399", "#fbbf24", "#f87171", "#60a5fa"];

export default function AdminDashboard() {
  // Tổng quan
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
  });
  // Biểu đồ
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [usersByMonth, setUsersByMonth] = useState([]);
  const [ordersByMonth, setOrdersByMonth] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [statsRes, revRes, statusRes, topRes, usersRes, ordersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/stats/revenue-by-month"),
        fetch("/api/admin/stats/orders-by-status"),
        fetch("/api/admin/stats/top-products"),
        fetch("/api/admin/stats/users-by-month"),
        fetch("/api/admin/stats/orders-by-month"),
      ]);
      setStats(await statsRes.json());
      setRevenueByMonth(await revRes.json());
      setOrdersByStatus(await statusRes.json());
      setTopProducts(await topRes.json());
      setUsersByMonth(await usersRes.json());
      setOrdersByMonth(await ordersRes.json());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats_cards = [
    {
      name: "Doanh thu",
      value: stats.totalRevenue,
      icon: CurrencyDollarIcon,
      color: "from-pink-400 to-pink-600",
      format: (v: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v),
    },
    {
      name: "Đơn hàng",
      value: stats.totalOrders,
      icon: ShoppingBagIcon,
      color: "from-blue-400 to-blue-600",
      format: (v: number) => v,
    },
    {
      name: "Người dùng",
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: "from-green-400 to-green-600",
      format: (v: number) => v,
    },
    {
      name: "Sản phẩm",
      value: stats.totalProducts,
      icon: ChartBarIcon,
      color: "from-yellow-400 to-yellow-600",
      format: (v: number) => v,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Helper: tháng
  const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const revenueData = months.map((m) => {
    const found = revenueByMonth.find((d: any) => String(d.month) === m);
    return { month: `Th${m}`, revenue: found ? Number(found.revenue) : 0 };
  });
  const usersData = months.map((m) => {
    const found = usersByMonth.find((d: any) => String(d.month) === m);
    return { month: `Th${m}`, users: found ? Number(found.count) : 0 };
  });
  const ordersData = months.map((m) => {
    const found = ordersByMonth.find((d: any) => String(d.month) === m);
    return { month: `Th${m}`, orders: found ? Number(found.count) : 0 };
  });

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-700">Tổng quan về hoạt động của cửa hàng</p>

      {/* Card số liệu tổng quan */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats_cards.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring" }}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${item.color} shadow-lg p-6 flex flex-col items-start`}
          >
            <div className="absolute right-4 top-4 opacity-20 text-white text-7xl">
              <item.icon className="w-16 h-16" />
            </div>
            <div className="z-10">
              <div className="text-white text-lg font-medium mb-2 flex items-center gap-2">
                <item.icon className="w-6 h-6" />
                {item.name}
              </div>
              <div className="text-3xl font-bold text-white">
                <CountUp end={item.value} duration={1.2} separator="," prefix={item.name === "Doanh thu" ? "₫" : ""} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Biểu đồ doanh thu theo tháng */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-indigo-700">Doanh thu theo tháng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={v => v.toLocaleString()} />
            <Tooltip formatter={v => v.toLocaleString()} />
            <Line type="monotone" dataKey="revenue" stroke="#f472b6" strokeWidth={3} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Biểu đồ người dùng mới theo tháng */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-green-700">Người dùng mới theo tháng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={usersData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="users" fill="#34d399" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Biểu đồ số lượng đơn hàng theo tháng */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-blue-700">Đơn hàng theo tháng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ordersData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="orders" fill="#60a5fa" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Biểu đồ trạng thái đơn hàng */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-pink-700">Tỷ lệ trạng thái đơn hàng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={ordersByStatus}
              dataKey="_count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ status, _count }) => `${status}: ${_count}`}
            >
              {ordersByStatus.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Biểu đồ top sản phẩm bán chạy */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-yellow-700">Top 5 sản phẩm bán chạy</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProducts} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#fbbf24" radius={[0, 8, 8, 0]}>
              {topProducts.map((entry, idx) => (
                <Cell key={`cell-bar-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
} 