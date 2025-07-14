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
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';
import styles from './dashboard.module.css';
import CardRevenue from './CardRevenue';
import CardOrders from './CardOrders';
import CardUsers from './CardUsers';
import CardProducts from './CardProducts';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (...args: any[]) => jsPDF;
  }
}

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
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string, revenue: number }[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<{ status: string, count: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string, sold: number }[]>([]);
  const [usersByMonth, setUsersByMonth] = useState<{ month: string, users: number }[]>([]);
  const [ordersByMonth, setOrdersByMonth] = useState<{ month: string, orders: number }[]>([]);
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
    const found = revenueByMonth.find((d: any) => {
      // d.month dạng 'YYYY-MM', lấy số tháng
      const monthNum = d.month?.split('-')[1]?.replace(/^0/, '') || d.month;
      return String(monthNum) === m;
    });
    return { month: `Th${m}`, revenue: found ? Number(found.revenue) : 0 };
  });
  const usersData = months.map((m) => {
    const found = usersByMonth.find((d: any) => {
      const monthNum = d.month?.split('-')[1]?.replace(/^0/, '') || d.month;
      return String(monthNum) === m;
    });
    return { month: `Th${m}`, users: found ? Number(found.users) : 0 };
  });
  const ordersData = months.map((m) => {
    const found = ordersByMonth.find((d: any) => {
      const monthNum = d.month?.split('-')[1]?.replace(/^0/, '') || d.month;
      return String(monthNum) === m;
    });
    return { month: `Th${m}`, orders: found ? Number(found.orders) : 0 };
  });

  // Hàm xuất Excel
  const exportExcel = () => {
    const wsData = [
      ['Tháng', 'Doanh thu', 'Người dùng mới', 'Đơn hàng'],
      ...months.map((m, i) => [
        `Th${m}`,
        revenueData[i].revenue,
        usersData[i].users,
        ordersData[i].orders
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');
    XLSX.writeFile(wb, 'dashboard_report.xlsx');
  };
  // Hàm xuất PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Báo cáo Dashboard', 14, 16);
    const tableData = months.map((m, i) => [
      `Th${m}`,
      revenueData[i].revenue,
      usersData[i].users,
      ordersData[i].orders
    ]);
    doc.autoTable({
      head: [['Tháng', 'Doanh thu', 'Người dùng mới', 'Đơn hàng']],
      body: tableData,
      startY: 24
    });
    doc.save('dashboard_report.pdf');
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-700">Tổng quan về hoạt động của cửa hàng</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold shadow hover:bg-green-600 transition">Xuất Excel</button>
          <button onClick={exportPDF} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold shadow hover:bg-blue-600 transition">Xuất PDF</button>
        </div>
      </div>
      {/* Card số liệu tổng quan */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <CardRevenue />
        <CardOrders />
        <CardUsers />
        <CardProducts />
      </div>
      {/* Hàng 2: Doanh thu & Người dùng mới */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-indigo-700">Doanh thu theo tháng</h2>
          <div className={styles.chartContainer}>
            <ResponsiveLine
              data={[{
                id: 'Doanh thu',
                data: revenueData.map(d => ({ x: d.month, y: d.revenue }))
              }]}
              margin={{ top: 30, right: 30, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0 }}
              axisBottom={{ legend: 'Tháng', legendOffset: 36, legendPosition: 'middle' }}
              axisLeft={{ legend: 'Doanh thu', legendOffset: -50, legendPosition: 'middle' }}
              colors={["#f472b6"]}
              pointSize={10}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              enableArea
              areaOpacity={0.15}
              useMesh
              theme={{ axis: { ticks: { text: { fontSize: 14 } } } }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-green-700">Người dùng mới theo tháng</h2>
          <div className={styles.chartContainer}>
            <ResponsiveBar
              data={usersData}
              keys={['users']}
              indexBy="month"
              margin={{ top: 30, right: 30, bottom: 50, left: 60 }}
              padding={0.3}
              colors={["#34d399"]}
              axisBottom={{ legend: 'Tháng', legendOffset: 36, legendPosition: 'middle' }}
              axisLeft={{ legend: 'Người dùng', legendOffset: -50, legendPosition: 'middle' }}
              theme={{ axis: { ticks: { text: { fontSize: 14 } } } }}
            />
          </div>
        </div>
      </div>
      {/* Hàng 3: Đơn hàng & Trạng thái đơn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-blue-700">Đơn hàng theo tháng</h2>
          <div className={styles.chartContainer}>
            <ResponsiveBar
              data={ordersData}
              keys={['orders']}
              indexBy="month"
              margin={{ top: 30, right: 30, bottom: 50, left: 60 }}
              padding={0.3}
              colors={["#60a5fa"]}
              axisBottom={{ legend: 'Tháng', legendOffset: 36, legendPosition: 'middle' }}
              axisLeft={{ legend: 'Đơn hàng', legendOffset: -50, legendPosition: 'middle' }}
              theme={{ axis: { ticks: { text: { fontSize: 14 } } } }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-pink-700">Tỷ lệ trạng thái đơn hàng</h2>
          <div className={styles.chartContainerTall}>
            <ResponsivePie
              data={ordersByStatus.map((d, idx) => ({ id: d.status, label: d.status, value: d.count, color: COLORS[idx % COLORS.length] }))}
              margin={{ top: 30, right: 30, bottom: 50, left: 30 }}
              innerRadius={0.5}
              padAngle={1}
              cornerRadius={5}
              colors={COLORS}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              theme={{ labels: { text: { fontSize: 14 } } }}
              legends={[{
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateY: 36,
                itemsSpacing: 10,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: '#999',
                symbolSize: 18,
                symbolShape: 'circle',
              }]}
            />
          </div>
        </div>
      </div>
      {/* Hàng 4: Top sản phẩm bán chạy */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-yellow-700">Top 5 sản phẩm bán chạy</h2>
        <div className={styles.chartContainerTall}>
          <ResponsiveBar
            data={topProducts}
            keys={['sold']}
            indexBy="name"
            layout="horizontal"
            margin={{ top: 30, right: 30, bottom: 50, left: 120 }}
            padding={0.3}
            colors={["#fbbf24"]}
            axisBottom={{ legend: 'Số lượng bán', legendOffset: 36, legendPosition: 'middle' }}
            axisLeft={{ legend: 'Sản phẩm', legendOffset: -100, legendPosition: 'middle' }}
            theme={{ axis: { ticks: { text: { fontSize: 14 } } } }}
          />
        </div>
      </div>
    </div>
  );
} 