'use client';

import React, { createContext, useContext, useState } from 'react';
import { Cart, CartItem, Product, ProductVariant } from '@/types';
import { useToast } from './toast-context';

interface CartContextType {
  cart: Cart;
  isDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant | null) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const DEFAULT_CART: Cart = {
  id: 'cart-session',
  items: [],
  subtotal: 0,
  shippingFee: 0,
  estimatedTax: 0,
  discount: 0,
  total: 0,
  itemCount: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sbj_cart');
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback to default
      }
    }
    return DEFAULT_CART;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { showToast } = useToast();

  // Save to LocalStorage & recalculate totals whenever cart items change
  const recalculateCart = (items: CartItem[]): Cart => {
    const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
    const shippingFee = subtotal > 3000 || subtotal === 0 ? 0 : 250; // Free shipping over ₹3,000
    const estimatedTax = Math.round(subtotal * 0.18); // 18% GST estimate
    const total = subtotal + shippingFee + estimatedTax;
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const updatedCart: Cart = {
      id: 'cart-session',
      items,
      subtotal,
      shippingFee,
      estimatedTax,
      discount: 0,
      total,
      itemCount,
    };

    try {
      localStorage.setItem('sbj_cart', JSON.stringify(updatedCart));
    } catch {
      // Storage unavailable
    }

    return updatedCart;
  };

  const addToCart = (product: Product, quantity = 1, variant: ProductVariant | null = null) => {
    const effectivePrice = (product.salePrice ?? product.basePrice) + (variant?.priceModifier ?? 0);
    const existingIndex = cart.items.findIndex(
      (item) => item.productId === product.id && item.variantId === (variant?.id ?? null)
    );

    let updatedItems: CartItem[];

    if (existingIndex > -1) {
      updatedItems = [...cart.items];
      const existing = updatedItems[existingIndex];
      const newQty = existing.quantity + quantity;
      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPrice: newQty * effectivePrice,
      };
    } else {
      const newItem: CartItem = {
        id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        variantId: variant?.id ?? null,
        product,
        selectedVariant: variant,
        quantity,
        unitPrice: effectivePrice,
        totalPrice: effectivePrice * quantity,
      };
      updatedItems = [...cart.items, newItem];
    }

    const newCart = recalculateCart(updatedItems);
    setCart(newCart);
    setIsDrawerOpen(true);
    showToast(`Added "${product.title}" to cart`);
  };

  const removeFromCart = (itemId: string) => {
    const updatedItems = cart.items.filter((item) => item.id !== itemId);
    setCart(recalculateCart(updatedItems));
    showToast('Item removed from cart', 'info');
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const updatedItems = cart.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          totalPrice: quantity * item.unitPrice,
        };
      }
      return item;
    });
    setCart(recalculateCart(updatedItems));
  };

  const clearCart = () => {
    setCart(DEFAULT_CART);
    localStorage.removeItem('sbj_cart');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isDrawerOpen,
        openCartDrawer: () => setIsDrawerOpen(true),
        closeCartDrawer: () => setIsDrawerOpen(false),
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
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
