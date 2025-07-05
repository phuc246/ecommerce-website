import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { motion } from 'framer-motion';

export default function CartFloatingButton() {
  const { items } = useCart();
  return (
    <Link
      href="/cart"
      className="fixed bottom-6 left-6 z-50 bg-pink-400 text-white rounded-full shadow-lg p-4 flex items-center justify-center hover:bg-pink-500 transition-colors group"
      aria-label="Giỏ hàng"
    >
      <ShoppingCart className="h-7 w-7" />
      {items.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white font-bold">
          {items.length}
        </span>
      )}
    </Link>
  );
}

export function WishlistFloatingButton() {
  const { wishlist } = useWishlist();
  return (
    <Link
      href="/wishlist"
      className="fixed bottom-24 left-6 z-50 bg-pink-200 text-pink-600 rounded-full shadow-lg p-4 flex items-center justify-center hover:bg-pink-300 transition-colors group"
      aria-label="Yêu thích"
    >
      <motion.span
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        className="flex"
      >
        <Heart className="h-7 w-7" />
      </motion.span>
      {wishlist.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-400 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white font-bold">
          {wishlist.length}
        </span>
      )}
    </Link>
  );
} 