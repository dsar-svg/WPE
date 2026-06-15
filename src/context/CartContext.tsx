import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, selectedChoices?: Record<string, string>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

function getItemKey(productId: string, selectedChoices?: Record<string, string>): string {
  if (!selectedChoices || Object.keys(selectedChoices).length === 0) return productId;
  const choiceStr = Object.entries(selectedChoices).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|');
  return `${productId}__${choiceStr}`;
}

function getChoicePriceAdjust(product: Product, selectedChoices?: Record<string, string>): number {
  if (!selectedChoices || !product.choices) return 0;
  let adjust = 0;
  for (const choice of product.choices) {
    const selected = selectedChoices[choice.name];
    if (selected) {
      const opt = choice.options.find(o => o.name === selected);
      if (opt?.priceAdjust) adjust += opt.priceAdjust;
    }
  }
  return adjust;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, selectedChoices?: Record<string, string>) => {
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

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0)
    );
  }, []);

  const updateNotes = useCallback((productId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, notes } : item
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
