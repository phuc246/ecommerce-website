'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLogo } from '@/hooks/useLogo';
import OrderStatusToast from './OrderStatusToast';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const { items } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { url: logoUrl, isCircular, isLoading: logoLoading, refresh: refreshLogo } = useLogo();
  const [orders, setOrders] = useState<any[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [orderChanged, setOrderChanged] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const prevOrderCount = useRef(0);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [unseenOrderIds, setUnseenOrderIds] = useState<string[]>([]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const panelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingNavigate, setPendingNavigate] = useState(false);
  // --- New: unseen by status ---
  const [hasUnseen, setHasUnseen] = useState(false);
  // Quản lý trạng thái đóng/mở từng toast
  const [closedToasts, setClosedToasts] = useState<string[]>([]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Track unseen orders in localStorage
  useEffect(() => {
    function updateUnseenOrders() {
      if (session?.user) {
        fetch('/api/orders')
          .then(res => res.json())
          .then(data => {
            setOrders(data);
            setOrderCount(data.length);
            // --- New: check unseen by status ---
            const seenStatus = JSON.parse(localStorage.getItem('ordersSeenStatus') || '[]');
            let unseen = false;
            let unseenIds: string[] = [];
            data.forEach((order: any) => {
              const found = seenStatus.find((s: any) => s.id === order.id && s.status === order.status);
              if (!found) {
                unseen = true;
                unseenIds.push(order.id);
              }
            });
            setHasUnseen(unseen);
            setUnseenOrderIds(unseenIds);
            if (prevOrderCount.current !== 0 && prevOrderCount.current !== data.length) {
              setOrderChanged(true);
              setTimeout(() => setOrderChanged(false), 2000);
            }
            prevOrderCount.current = data.length;
          });
      }
    }
    updateUnseenOrders();
    // Lắng nghe sự kiện storage để cập nhật khi localStorage thay đổi từ tab khác hoặc khi click từng đơn
    window.addEventListener('storage', updateUnseenOrders);
    return () => {
      window.removeEventListener('storage', updateUnseenOrders);
    };
  }, [session?.user]);

  // Show panel when clicking badge
  const handleOrderBadgeClick = () => {
    setDropdownOpen(false);
    // Không chặn event, luôn cho phép chuyển trang
  };

  // Animate through orders if multiple
  useEffect(() => {
    if (!showOrderPanel || unseenOrderIds.length === 0) return;
    if (orders.length <= 1) {
      panelTimeoutRef.current = setTimeout(() => setShowOrderPanel(false), 2000);
      return;
    }
    if (currentPanelIndex < unseenOrderIds.length - 1) {
      panelTimeoutRef.current = setTimeout(() => setCurrentPanelIndex(i => i + 1), 1500);
    } else {
      panelTimeoutRef.current = setTimeout(() => setShowOrderPanel(false), 2000);
    }
    return () => {
      if (panelTimeoutRef.current) clearTimeout(panelTimeoutRef.current);
    };
  }, [showOrderPanel, currentPanelIndex, unseenOrderIds.length, orders.length]);

  // After panel closes, navigate if needed
  useEffect(() => {
    if (!showOrderPanel && pendingNavigate) {
      setPendingNavigate(false);
      window.location.href = '/profile/orders';
    }
  }, [showOrderPanel, pendingNavigate]);

  // Reset closedToasts khi unseenOrderIds thay đổi (ví dụ: reload, có đơn mới)
  useEffect(() => {
    setClosedToasts([]);
  }, [unseenOrderIds.join(",")]);

  // Helper to get order status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPED': return 'Đang giao';
      case 'DELIVERED': return 'Đã giao';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isAuthPage ? 'bg-transparent' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Bên trái: để trống hoặc menu mobile */}
          <div className="flex-1 flex items-center justify-start">
            {!isAuthPage && (
              <div className="sm:hidden flex items-center">
                <button
                  type="button"
                  className={"inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 " + (isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-white hover:text-gray-200')}
                  aria-label="Mở menu điều hướng"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </div>
          {/* Logo ở giữa */}
          <div className="flex-1 flex items-center justify-center">
            <Link href="/" className="flex items-center justify-center group" aria-label="Trang chủ">
              <div className={`relative w-14 h-14 flex items-center justify-center ${isCircular ? 'rounded-full overflow-hidden' : ''} animate-spin-slow`}>
                {!logoLoading && logoUrl && (
                  <Image
                    src={logoUrl}
                    alt="Logo trang chủ"
                    width={56}
                    height={56}
                    className={`transition-all duration-300 ${logoLoading ? 'opacity-0' : 'opacity-100'} ${isCircular ? 'rounded-full' : ''}`}
                    style={{ objectFit: isCircular ? 'cover' : 'contain' }}
                    priority
                    unoptimized={logoUrl.startsWith('data:')}
                  />
                )}
              </div>
            </Link>
          </div>
          {/* Bên phải: đăng nhập hoặc profile */}
          <div className="flex-1 flex items-center justify-end">
            {!isAuthPage && (
              <div className="hidden sm:flex items-center gap-4 ml-4">
                {session?.user ? (
                  <>
                    <DropdownMenu onOpenChange={setDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 focus:outline-none relative">
                          <span className="hidden sm:inline text-sm font-medium relative">
                            {session.user.name || session.user.email}
                            {/* Red dot notification if there are unseen orders */}
                            {hasUnseen && (
                              <span className="absolute -top-2 -right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {session.user.role === "ADMIN" ? (
                          <>
                            {pathname !== "/admin/dashboard" && (
                              <DropdownMenuItem asChild>
                                <Link href="/admin/dashboard">Trang quản trị</Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>Đăng xuất</DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/profile">Hồ sơ</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/profile/orders" className="flex items-center gap-2" onClick={handleOrderBadgeClick}>
                                Đơn hàng của tôi
                                {/* Badge chỉ hiện khi có đơn mới/chưa xem */}
                                {hasUnseen && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-pink-500 text-white animate-pulse">
                                    {unseenOrderIds.length}
                                  </span>
                                )}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>Đăng xuất</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.08, boxShadow: '0 0 16px #f472b6' }}
                      whileTap={{ scale: 0.96 }}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 15, delay: 0.2 } }}
                    >
                      <Link
                        href="/login"
                        className="bg-pink-400 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-pink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400"
                        aria-label="Đăng nhập"
                      >
                        Đăng nhập
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Overlay mobile menu giữ nguyên */}
      {!isAuthPage && mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 flex flex-col items-center justify-center gap-8 animate-fade-in sm:hidden">
          <button
            className="absolute top-6 right-6 text-white text-3xl focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu điều hướng"
          >
            <X className="h-8 w-8" />
          </button>
          <Link href="/" className={`text-2xl font-bold ${pathname === '/' ? 'text-indigo-500 underline' : 'text-white hover:text-indigo-400'}`} onClick={() => setMobileMenuOpen(false)}>Trang chủ</Link>
          <Link href="/products" className={`text-2xl font-bold ${pathname === '/products' ? 'text-indigo-500 underline' : 'text-white hover:text-indigo-400'}`} onClick={() => setMobileMenuOpen(false)}>Sản phẩm</Link>
          {!session?.user && (
            <Link href="/login" className="text-2xl font-bold text-white bg-indigo-600 px-6 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>Đăng nhập</Link>
          )}
        </div>
      )}
      {/* Notification panel for new orders */}
      {/* Hiển thị nhiều toast, mỗi toast cho một đơn hàng mới/chưa xem */}
      {hasUnseen && unseenOrderIds.length > 0 && orders.length > 0 && (
        <div className="fixed top-6 right-8 flex flex-col gap-4 z-[200]">
          {unseenOrderIds.filter(id => !closedToasts.includes(id)).map((orderId) => {
            const order = orders.find((o: any) => o.id === orderId);
            if (!order) return null;
            const getItemDisplayPrice = (item: any) => {
              const salePrice = item.salePrice;
              if (typeof salePrice === 'number' && salePrice > 0 && salePrice < item.price) {
                return salePrice;
              }
              return item.price;
            };
            const subtotal = (order.items || []).reduce((sum: number, item: any) => sum + (getItemDisplayPrice(item) * item.quantity), 0);
            const total = subtotal + (order.shippingFee || 0) - (order.discountAmount || 0);
            return (
              <OrderStatusToast
                key={order.id}
                open={true}
                onClose={() => setClosedToasts(prev => [...prev, order.id])}
                orderId={order.id}
                status={order.status}
                total={total}
                itemCount={order.items?.length || 0}
              />
            );
          })}
        </div>
      )}
    </motion.nav>
  );
} 