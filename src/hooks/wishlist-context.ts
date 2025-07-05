import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
    await fetch('/api/user/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    fetchWishlist();
  };

  const removeFromWishlist = async (productId: string) => {
    await fetch(`/api/user/wishlist/${productId}`, { method: 'DELETE' });
    fetchWishlist();
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