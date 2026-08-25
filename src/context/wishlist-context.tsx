'use client';

import React, { createContext, useContext, useState } from 'react';
import { Product } from '@/types';
import { useToast } from './toast-context';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sbj_wishlist');
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [];
  });
  const { showToast } = useToast();

  const saveWishlist = (products: Product[]) => {
    setWishlistProducts(products);
    try {
      localStorage.setItem('sbj_wishlist', JSON.stringify(products));
    } catch {
      // Unavailable
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistProducts.some((p) => p.id === productId);
  };

  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      const updated = wishlistProducts.filter((p) => p.id !== product.id);
      saveWishlist(updated);
      showToast(`Removed "${product.title}" from Wishlist`, 'info');
    } else {
      const updated = [...wishlistProducts, product];
      saveWishlist(updated);
      showToast(`Saved "${product.title}" to Wishlist`, 'success');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds: wishlistProducts.map((p) => p.id),
        wishlistProducts,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlistProducts.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
