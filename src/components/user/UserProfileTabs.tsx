'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonalInfoTab from './PersonalInfoTab';
import AddressesTab from './AddressesTab';
import PaymentMethodsTab from './PaymentMethodsTab';
import OrderHistoryTab from './OrderHistoryTab';
import WishlistTab from './WishlistTab';

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
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
        <TabsTrigger value="personal-info" className="text-sm md:text-base">
          Thông tin cá nhân
        </TabsTrigger>
        <TabsTrigger value="addresses" className="text-sm md:text-base">
          Địa chỉ
        </TabsTrigger>
        <TabsTrigger value="payment-methods" className="text-sm md:text-base">
          Phương thức thanh toán
        </TabsTrigger>
        <TabsTrigger value="order-history" className="text-sm md:text-base">
          Lịch sử đơn hàng
        </TabsTrigger>
        <TabsTrigger value="wishlist" className="text-sm md:text-base">
          Sản phẩm yêu thích
        </TabsTrigger>
      </TabsList>

      <div className="mt-6 p-4 bg-white rounded-lg shadow">
        <TabsContent value="personal-info">
          <PersonalInfoTab user={user} />
        </TabsContent>
        
        <TabsContent value="addresses">
          <AddressesTab userId={user.id} />
        </TabsContent>
        
        <TabsContent value="payment-methods">
          <PaymentMethodsTab userId={user.id} />
        </TabsContent>
        
        <TabsContent value="order-history">
          <OrderHistoryTab userId={user.id} />
        </TabsContent>
        
        <TabsContent value="wishlist">
          <WishlistTab userId={user.id} />
        </TabsContent>
      </div>
    </Tabs>
  );
} 