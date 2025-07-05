import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  isPending: boolean;
  lastAction: string | null;
  lastError: string | null;
  addItem: (item: CartItem, cb?: (ok: boolean, msg?: string) => void) => Promise<void>;
  removeItem: (id: string, cb?: (ok: boolean, msg?: string) => void) => Promise<void>;
  updateQuantity: (id: string, quantity: number, cb?: (ok: boolean, msg?: string) => void) => Promise<void>;
  clearCart: (cb?: (ok: boolean, msg?: string) => void) => Promise<void>;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isPending: false,
      lastAction: null,
      lastError: null,
      addItem: async (item, cb) => {
        set({ isPending: true, lastAction: 'add', lastError: null });
        try {
          const existingItem = get().items.find((i) => i.id === item.id);
          if (existingItem) {
            set((state) => {
              return {
                items: state.items.map((i) =>
                  i.id === item.id
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i
                ),
              };
            });
          } else {
            set((state) => {
              return { items: [...state.items, item] };
            });
          }
          cb?.(true);
        } catch (e) {
          set({ lastError: 'Lỗi khi thêm vào giỏ hàng' });
          cb?.(false, 'Lỗi khi thêm vào giỏ hàng');
        } finally {
          set({ isPending: false });
        }
      },
      removeItem: async (id, cb) => {
        set({ isPending: true, lastAction: 'remove', lastError: null });
        try {
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }));
          cb?.(true);
        } catch (e) {
          set({ lastError: 'Lỗi khi xóa khỏi giỏ hàng' });
          cb?.(false, 'Lỗi khi xóa khỏi giỏ hàng');
        } finally {
          set({ isPending: false });
        }
      },
      updateQuantity: async (id, quantity, cb) => {
        set({ isPending: true, lastAction: 'update', lastError: null });
        try {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
          }));
          cb?.(true);
        } catch (e) {
          set({ lastError: 'Lỗi khi cập nhật số lượng' });
          cb?.(false, 'Lỗi khi cập nhật số lượng');
        } finally {
          set({ isPending: false });
        }
      },
      clearCart: async (cb) => {
        set({ isPending: true, lastAction: 'clear', lastError: null });
        try {
          set({ items: [] });
          cb?.(true);
        } catch (e) {
          set({ lastError: 'Lỗi khi xóa giỏ hàng' });
          cb?.(false, 'Lỗi khi xóa giỏ hàng');
        } finally {
          set({ isPending: false });
        }
      },
    }),
    {
      name: "cart-storage",
    }
  )
); 