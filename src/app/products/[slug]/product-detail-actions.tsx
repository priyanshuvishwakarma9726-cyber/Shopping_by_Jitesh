'use client';

import React, { useState } from 'react';
import { Product, ProductVariant } from '@/types';
import { Plus, Minus, ShoppingBag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

export function ProductDetailActions({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] || null
  );

  const isSaved = isInWishlist(product.id);

  return (
    <div className="space-y-6 pt-2">
      {/* Variants Selection */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Variant:
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedVariant?.id === v.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-800 border-stone-300 hover:border-stone-400'
                }`}
              >
                {v.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector & Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-3 text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="px-5 text-sm font-bold text-slate-900">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="p-3 text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <Button
          onClick={() => addToCart(product, quantity, selectedVariant)}
          size="lg"
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold"
          leftIcon={<ShoppingBag className="w-5 h-5" />}
        >
          Add To Shopping Bag
        </Button>

        <button
          onClick={() => toggleWishlist(product)}
          className={`p-3.5 rounded-xl border transition-all ${
            isSaved
              ? 'bg-rose-500 text-white border-rose-500'
              : 'bg-white text-slate-700 border-stone-300 hover:bg-stone-100'
          }`}
          title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
