import React from 'react';
import { getProducts } from '@/services/product-service';
import { ProductGrid } from '@/components/features/ProductGrid';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams;
  const cleanQuery = q.trim();
  const { products, total } = await getProducts({ searchQuery: cleanQuery });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {cleanQuery ? `Search Results for "${cleanQuery}"` : 'All Products Search'}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Found {total} matching {total === 1 ? 'item' : 'items'} in store
        </p>
      </div>

      <ProductGrid
        products={products}
        emptyMessage={`No items found matching "${cleanQuery}". Try searching for categories like headphones, watch, kurta, lamp, or serum.`}
      />
    </div>
  );
}
