// ============================================================================
// Zustand Cart Store — persisted to localStorage
// ============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calcVatAmount } from "@/lib/pricing";

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
  discountCode: string | null;
  discountPercentage: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, selectedOption: string) => void;
  updateQuantity: (productId: string, selectedOption: string, quantity: number) => void;
  clearCart: () => void;
  setDiscount: (code: string, percentage: number) => void;
  clearDiscount: () => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getDiscountedSubtotal: () => number;
  getVatAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discountCode: null,
      discountPercentage: 0,

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

      clearCart: () => set({ items: [], discountCode: null, discountPercentage: 0 }),

      setDiscount: (code, percentage) => set({ discountCode: code, discountPercentage: percentage }),
      clearDiscount: () => set({ discountCode: null, discountPercentage: 0 }),

      getSubtotal: () =>
        get().items.reduce(
          (total, item) => total + item.pricePerUnit * item.quantity,
          0
        ),

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const pct = get().discountPercentage;
        return pct > 0 ? parseFloat(((subtotal * pct) / 100).toFixed(2)) : 0;
      },

      getDiscountedSubtotal: () => {
        return get().getSubtotal() - get().getDiscountAmount();
      },

      getVatAmount: () => calcVatAmount(get().getDiscountedSubtotal()),

      getItemCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: "cart-storage",
    }
  )
);
