"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';


interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
}

interface WishlistContextType {
  wishlist: Product[];
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  refresh: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    const res = await fetch('/api/user/wishlist');
    if (res.ok) {
      setWishlist(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const addToWishlist = async (productId: string) => {
    const res = await fetch('/api/user/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    if (res.status === 401) {
      toast.error('Bạn phải đăng nhập để sử dụng tính năng này!');
      return;
    }
    if (res.ok) {
      toast.success('Đã thêm vào danh sách yêu thích!');
      fetchWishlist();
    } else {
      toast.error('Thêm vào wishlist thất bại!');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const res = await fetch(`/api/user/wishlist/${productId}`, { method: 'DELETE' });
    if (res.status === 401) {
      toast.error('Bạn phải đăng nhập để sử dụng tính năng này!');
      return;
    }
    if (res.ok) {
      toast.success('Đã xoá khỏi danh sách yêu thích!');
      fetchWishlist();
    } else {
      toast.error('Xoá khỏi wishlist thất bại!');
    }
  };

  const isWishlisted = (productId: string) => wishlist.some(p => p.id === productId);

  const refresh = fetchWishlist;

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, isWishlisted, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
} 