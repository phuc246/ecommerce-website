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
    <div className="container mx-auto px-4 mt-8">
      <UserProfileTabs user={user} />
    </div>
  );
} 