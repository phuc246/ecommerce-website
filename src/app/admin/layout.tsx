import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  console.log("[ADMIN LAYOUT SESSION]", session);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
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