import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Truck } from 'lucide-react';
import React from 'react';

interface OrderStatusToastProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  status: string;
  total: number;
  style?: React.CSSProperties;
  // Thêm số lượng sản phẩm
  itemCount?: number;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  PROCESSING: 'Đã xác nhận',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ',
  CANCELED: 'Đã huỷ',
  CANCEL_REQUESTED: 'Chờ huỷ',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Package className="w-6 h-6 text-pink-500" />, // Đơn mới
  PROCESSING: <Package className="w-6 h-6 text-yellow-500" />, // Đã xác nhận
  SHIPPED: <Truck className="w-6 h-6 text-blue-500" />, // Đang giao
  DELIVERED: <Package className="w-6 h-6 text-green-500" />, // Đã giao
  CANCELLED: <X className="w-6 h-6 text-gray-400" />, // Đã huỷ
  CANCELED: <X className="w-6 h-6 text-gray-400" />, // Đã huỷ
  CANCEL_REQUESTED: <Package className="w-6 h-6 text-orange-400" />, // Chờ huỷ
};

export default function OrderStatusToast({ open, onClose, orderId, status, total, style, itemCount, className }: OrderStatusToastProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`z-[200] min-w-[200px] max-w-[240px] ${className || ''}`}
          style={style}
        >
          <Alert className="relative bg-white border-pink-200 px-4 py-4 rounded-2xl">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-pink-500 transition"
              onClick={onClose}
              aria-label="Đóng thông báo"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              {STATUS_ICONS[status] || <Package className="w-6 h-6 text-pink-500" />}
              <span className="text-xs font-mono text-gray-400">#{orderId.slice(0, 8)}</span>
            </div>
            <AlertDescription>
              <div className="text-sm font-semibold text-gray-700 mb-1">
                Tình trạng: <span className="text-blue-500 animate-pulse">{STATUS_LABELS[status] || status}</span>
              </div>
              <div className="text-xs text-gray-500 mb-1">Tổng tiền: <span className="text-pink-500 font-bold">{total.toLocaleString('vi-VN')}₫</span></div>
              {typeof itemCount === 'number' && (
                <div className="text-xs text-gray-500">{itemCount} sản phẩm</div>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 