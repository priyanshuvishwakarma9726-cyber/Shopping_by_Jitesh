import React from 'react';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getProducts } from '@/services/product-service';
import { ProductGrid } from '@/components/features/ProductGrid';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const { products, total } = await getProducts({ categorySlug: slug });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Category Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
          Department Collection
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{category.name}</h1>
        <p className="text-sm text-stone-300 max-w-xl">{category.description}</p>
        <p className="text-xs font-semibold text-stone-400 pt-2">{total} items available in this category</p>
      </div>

      {/* Products Grid */}
      <ProductGrid
        products={products}
        emptyMessage={`No products currently listed in ${category.name}. Check back soon for new arrivals.`}
      />
    </div>
  );
}
