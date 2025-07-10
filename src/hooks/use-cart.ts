import { create } from "zustand";

export type CartItem = {
  id: string;
  productVariantId: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  isPending: boolean;
  lastAction: string | null;
  lastError: string | null;
  fetchCart: () => Promise<void>;
  addItem: (item: { productId: string; colorId: string; sizeId: string; quantity: number }, cb?: (ok: boolean, msg?: string) => void) => Promise<void>;
  removeItem: (id: string, cb?: (ok: boolean, msg?: string) => void) => Promise<void>;
  updateQuantity: (id: string, quantity: number, cb?: (ok: boolean, msg?: string) => void) => Promise<void>;
  clearCart: (cb?: (ok: boolean, msg?: string) => void) => Promise<void>;
};

export const useCart = create<CartStore>()((set, get) => ({
  items: [],
  isPending: false,
  lastAction: null,
  lastError: null,
  fetchCart: async () => {
    set({ isPending: true });
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) throw new Error("Không thể tải giỏ hàng");
      const data = await res.json();
      const validItems = (data.items || []).map((item: any) => ({
        id: item.id,
        productVariantId: item.productVariantId,
        name: item.productVariant?.product?.name || '',
        price: item.productVariant?.price || 0,
        image: item.productVariant?.product?.image || '',
        color: item.productVariant?.color || '',
        size: item.productVariant?.size || '',
        quantity: item.quantity,
      }));
      set({ items: validItems });
      // Nếu không có item hợp lệ, xóa localStorage cart
      if (validItems.length === 0) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cart');
        }
      }
    } catch (e) {
      set({ lastError: 'Lỗi khi tải giỏ hàng' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
      }
    } finally {
      set({ isPending: false });
    }
  },
  addItem: async ({ productId, colorId, sizeId, quantity }, cb) => {
    set({ isPending: true, lastAction: 'add', lastError: null });
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, colorId, sizeId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi thêm vào giỏ hàng');
      await get().fetchCart();
      cb?.(true);
    } catch (e: any) {
      set({ lastError: e.message || 'Lỗi khi thêm vào giỏ hàng' });
      cb?.(false, e.message);
    } finally {
      set({ isPending: false });
    }
  },
  removeItem: async (id, cb) => {
    set({ isPending: true, lastAction: 'remove', lastError: null });
    try {
      const res = await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa khỏi giỏ hàng');
      await get().fetchCart();
      cb?.(true);
    } catch (e: any) {
      set({ lastError: e.message || 'Lỗi khi xóa khỏi giỏ hàng' });
      cb?.(false, e.message);
    } finally {
      set({ isPending: false });
    }
  },
  updateQuantity: async (id, quantity, cb) => {
    set({ isPending: true, lastAction: 'update', lastError: null });
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi cập nhật số lượng');
      await get().fetchCart();
      cb?.(true);
    } catch (e: any) {
      set({ lastError: e.message || 'Lỗi khi cập nhật số lượng' });
      cb?.(false, e.message);
    } finally {
      set({ isPending: false });
    }
  },
  clearCart: async (cb) => {
    set({ isPending: true, lastAction: 'clear', lastError: null });
    try {
      // Xóa từng item
      const { items } = get();
      for (const item of items) {
        await get().removeItem(item.id);
      }
      await get().fetchCart();
      cb?.(true);
    } catch (e: any) {
      set({ lastError: e.message || 'Lỗi khi xóa giỏ hàng' });
      cb?.(false, e.message);
    } finally {
      set({ isPending: false });
    }
  },
})); 