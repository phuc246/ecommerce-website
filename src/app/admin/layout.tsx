import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { headers } from 'next/headers';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Detect device type
  const ua = headers().get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /ipad|tablet|playbook|silk/i.test(ua);
  const isDesktopOrTablet = !isMobile || isTablet;

  if (isMobile && !isTablet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-white to-pink-200 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-pink-200 relative animate-fade-in">
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 border-4 border-pink-300 shadow-lg">
              <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-pink-600 mb-2 tracking-tight">Chỉ hỗ trợ đăng nhập admin<br/>trên máy tính hoặc tablet</h2>
          <p className="mb-8 text-gray-700 text-base">Vui lòng sử dụng máy tính hoặc máy tính bảng để truy cập trang quản trị.<br/>Nếu bạn đang dùng điện thoại, hãy đăng xuất và đăng nhập lại trên thiết bị phù hợp.</p>
          <form method="post" action="/api/auth/signout">
            <button type="submit" className="w-full py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg hover:from-pink-600 hover:to-fuchsia-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400">Đăng xuất</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <AdminHeader />
      <div className="flex flex-1 min-h-0">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 