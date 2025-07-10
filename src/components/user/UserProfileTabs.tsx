'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonalInfoTab from '@/components/user/PersonalInfoTab';
import AddressesTab from '@/components/user/AddressesTab';
import PaymentMethodsTab from './PaymentMethodsTab';
import OrderHistoryTab from '@/components/user/OrderHistoryTab';
import ChangePasswordTab from '@/components/user/ChangePasswordTab';
import WishlistTab from '@/components/user/WishlistTab';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface UserProfileTabsProps {
  user: User;
}

export default function UserProfileTabs({ user }: UserProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('personal-info');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gradient-to-r from-pink-200 via-fuchsia-200 to-indigo-200 shadow-lg rounded-xl animate-fade-in-up">
        <TabsTrigger value="personal-info" className="text-sm md:text-base font-bold text-fuchsia-700 hover:bg-pink-100 transition-all duration-200">
          Thông tin cá nhân
        </TabsTrigger>
        <TabsTrigger value="addresses" className="text-sm md:text-base font-bold text-fuchsia-700 hover:bg-pink-100 transition-all duration-200">
          Địa chỉ giao nhận
        </TabsTrigger>
        <TabsTrigger value="payment-methods" className="text-sm md:text-base font-bold text-fuchsia-700 hover:bg-pink-100 transition-all duration-200">
          Phương thức thanh toán
        </TabsTrigger>
        <TabsTrigger value="change-password" className="text-sm md:text-base font-bold text-fuchsia-700 hover:bg-pink-100 transition-all duration-200">
          Đổi mật khẩu
        </TabsTrigger>
      </TabsList>

      <div className="mt-6 p-4 bg-white rounded-lg shadow">
        <TabsContent value="personal-info">
          <PersonalInfoTab />
        </TabsContent>
        
        <TabsContent value="addresses">
          <AddressesTab />
        </TabsContent>
        
        <TabsContent value="payment-methods">
          <PaymentMethodsTab userId={user.id} />
        </TabsContent>
        
        <TabsContent value="order-history">
          <OrderHistoryTab />
        </TabsContent>
        
        <TabsContent value="change-password">
          <ChangePasswordTab />
        </TabsContent>
      </div>
    </Tabs>
  );
} 