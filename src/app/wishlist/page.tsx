'use client';

import React from 'react';
import { useWishlist } from '@/context/wishlist-context';
import { ProductGrid } from '@/components/features/ProductGrid';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { wishlistProducts } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <Heart className="w-8 h-8 text-rose-500 fill-current" />
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Saved Wishlist</h1>
          <p className="text-sm text-stone-500">
            {wishlistProducts.length} items saved for later
          </p>
        </div>
      </div>

      <ProductGrid
        products={wishlistProducts}
        emptyMessage="Your wishlist is currently empty. Click the heart icon on any product to save it here."
      />
    </div>
  );
}
