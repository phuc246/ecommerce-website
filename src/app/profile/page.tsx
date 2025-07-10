"use client";

import { useSession } from "next-auth/react";
import UserProfileTabs from '@/components/user/UserProfileTabs';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="text-center py-20">Đang tải...</div>;
  }
  if (!session?.user) {
    return <div className="text-center py-20 text-red-500">Bạn cần đăng nhập để xem trang này.</div>;
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: session.user.role,
  };

  return (
    <div className="container mx-auto px-4 pt-24 bg-gradient-to-br from-pink-100 via-fuchsia-100 to-indigo-100 min-h-screen animate-fade-in-up rounded-2xl shadow-xl">
      <UserProfileTabs user={user} />
    </div>
  );
} 