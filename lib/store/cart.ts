// ============================================================================
// Zustand Cart Store — persisted to localStorage
// ============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { siteConfig } from "@/site.config";

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  selectedOption: string;
  pricePerUnit: number;
  quantity: number;
  slug: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, selectedOption: string) => void;
  updateQuantity: (productId: string, selectedOption: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getVatAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (item) =>
              item.productId === newItem.productId &&
              item.selectedOption === newItem.selectedOption
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === newItem.productId &&
                item.selectedOption === newItem.selectedOption
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              ),
            };
          }

          return { items: [...state.items, newItem] };
        }),

      removeItem: (productId, selectedOption) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.productId === productId && item.selectedOption === selectedOption)
          ),
        })),

      updateQuantity: (productId, selectedOption, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (item) =>
                    !(
                      item.productId === productId &&
                      item.selectedOption === selectedOption
                    )
                )
              : state.items.map((item) =>
                  item.productId === productId &&
                  item.selectedOption === selectedOption
                    ? { ...item, quantity }
                    : item
                ),
        })),

      clearCart: () => set({ items: [] }),

      getSubtotal: () =>
        get().items.reduce(
          (total, item) => total + item.pricePerUnit * item.quantity,
          0
        ),

      getVatAmount: () => get().getSubtotal() * siteConfig.vatRate,

      getItemCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: "cart-storage",
    }
  )
);
