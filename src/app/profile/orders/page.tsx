import OrderHistoryTab from '@/components/user/OrderHistoryTab';

export default function OrdersPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-yellow-50 to-blue-100 pt-24 px-2 flex flex-col items-center justify-start">
      <OrderHistoryTab />
    </div>
  );
} 