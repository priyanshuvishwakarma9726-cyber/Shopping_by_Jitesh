'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Star, ShoppingBag, Eye } from 'lucide-react';
import { Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isSaved = isInWishlist(product.id);

  const primaryImage = product.images?.[0]?.imageUrl || '';
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-stone-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-stone-300">
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-stone-100 overflow-hidden">
        <SafeImage
          src={primaryImage}
          categoryKey={product.categoryId || product.categorySlug}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <Badge variant="brand" className="bg-amber-600 text-white font-bold border-0">
              -{discountPercent}% OFF
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge variant="neutral" className="bg-slate-900 text-white font-semibold border-0">
              NEW
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
            isSaved
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-white/80 text-slate-700 hover:bg-white hover:text-rose-500'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Hover Overlay */}
        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
          <Link
            href={`/products/${product.slug}`}
            className="p-3 bg-white text-slate-900 rounded-xl hover:bg-amber-500 hover:text-white transition-colors shadow-lg"
            title="View Product Details"
          >
            <Eye className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-1">
            <span>{product.brand}</span>
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{product.averageRating}</span>
              <span className="text-stone-400">({product.reviewCount})</span>
            </div>
          </div>

          <Link href={`/products/${product.slug}`} className="group-hover:text-amber-700 transition-colors">
            <h3 className="text-base font-bold text-slate-900 line-clamp-1">
              {product.title}
            </h3>
          </Link>
          <p className="text-xs text-stone-500 line-clamp-2 mt-1">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-slate-900">
                ₹{(product.salePrice ?? product.basePrice).toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{product.basePrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-amber-600 transition-colors shadow-sm flex items-center justify-center"
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

