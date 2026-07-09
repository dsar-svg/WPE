import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { Product, CartItem } from '../types';

const CART_STORAGE_KEY = 'wpe_cart';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, selectedChoices?: string[]) => void;
  removeFromCart: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  updateNotes: (itemKey: string, notes: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function getItemKey(productId: string, selectedChoices?: string[]): string {
  if (!selectedChoices || selectedChoices.length === 0) return productId;
  const sorted = [...selectedChoices].sort().join('|');
  return `${productId}__${sorted}`;
}

function getChoicePriceAdjust(product: Product, selectedChoices?: string[]): number {
  if (!selectedChoices || !product.choices) return 0;
  let adjust = 0;
  for (const choice of product.choices) {
    if (selectedChoices.includes(choice.name)) {
      adjust += choice.priceAdjust ?? 0;
    }
  }
  return adjust;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((product: Product, selectedChoices?: string[]) => {
    setItems((prev) => {
      const key = getItemKey(product.id, selectedChoices);
      const existing = prev.find((item) => getItemKey(item.id, item.selectedChoices) === key);
      if (existing) {
        return prev.map((item) =>
          getItemKey(item.id, item.selectedChoices) === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, notes: '', selectedChoices }];
    });
  }, []);

  const removeFromCart = useCallback((itemKey: string) => {
    setItems((prev) => prev.filter((item) => getItemKey(item.id, item.selectedChoices) !== itemKey));
  }, []);

  const updateQuantity = useCallback((itemKey: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        getItemKey(item.id, item.selectedChoices) === itemKey ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0)
    );
  }, []);

  const updateNotes = useCallback((itemKey: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        getItemKey(item.id, item.selectedChoices) === itemKey ? { ...item, notes } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => {
    const priceAdjust = getChoicePriceAdjust(item, item.selectedChoices);
    return sum + (item.price + priceAdjust) * item.quantity;
  }, 0), [items]);

  const value = useMemo(() => ({
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateNotes,
    clearCart,
    total,
  }), [items, addToCart, removeFromCart, updateQuantity, updateNotes, clearCart, total]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
