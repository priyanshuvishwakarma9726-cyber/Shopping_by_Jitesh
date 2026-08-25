import React from 'react';
import Link from 'next/link';
import { getProducts, getCategories } from '@/services/product-service';
import { ProductGrid } from '@/components/features/ProductGrid';
import { SlidersHorizontal, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    inStock?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const categories = await getCategories();

  const activeCategory = params.category || '';
  const activeSort = params.sort || 'featured';
  const activeRating = params.rating ? Number(params.rating) : 0;
  const activeMinPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const activeMaxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const activeInStock = params.inStock === 'true';
  const currentPage = params.page ? Math.max(1, Number(params.page)) : 1;

  const { products, total, totalPages } = await getProducts({
    categorySlug: activeCategory,
    searchQuery: params.search,
    sortBy: activeSort as 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest',
    minPrice: activeMinPrice,
    maxPrice: activeMaxPrice,
    rating: activeRating,
    inStockOnly: activeInStock,
    page: currentPage,
    pageSize: 12,
  });

  const buildQueryUrl = (newParams: Record<string, string | number | undefined>) => {
    const merged = {
      category: activeCategory || undefined,
      sort: activeSort !== 'featured' ? activeSort : undefined,
      rating: activeRating > 0 ? activeRating : undefined,
      minPrice: activeMinPrice,
      maxPrice: activeMaxPrice,
      search: params.search || undefined,
      page: currentPage > 1 ? currentPage : undefined,
      ...newParams,
    };

    const queryParts = Object.entries(merged)
      .filter(([, val]) => val !== undefined && val !== '')
      .map(([key, val]) => `${key}=${encodeURIComponent(String(val))}`);

    return queryParts.length > 0 ? `/products?${queryParts.join('&')}` : '/products';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
          Marketplace Catalog
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          All Products & Collections
        </h1>
        <p className="text-sm text-stone-300 max-w-xl">
          Browse items across electronics, fashion, home decor, accessories, and beauty.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block bg-white rounded-3xl border border-stone-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" /> Filters
            </h3>
            {(activeCategory || activeRating > 0 || activeMinPrice || activeMaxPrice || activeInStock) && (
              <Link href="/products" className="text-xs font-bold text-amber-600 hover:text-amber-700">
                Clear All
              </Link>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Department
            </label>
            <div className="flex flex-col gap-1 text-xs font-medium text-stone-600">
              <Link
                href={buildQueryUrl({ category: undefined, page: 1 })}
                className={`py-1.5 px-3 rounded-xl transition-colors ${
                  !activeCategory ? 'bg-amber-50 font-bold text-amber-900' : 'hover:bg-stone-50'
                }`}
              >
                All Departments
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildQueryUrl({ category: cat.slug, page: 1 })}
                  className={`py-1.5 px-3 rounded-xl transition-colors ${
                    activeCategory === cat.slug ? 'bg-amber-50 font-bold text-amber-900' : 'hover:bg-stone-50'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-2 pt-4 border-t border-stone-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Minimum Rating
            </label>
            <div className="flex flex-col gap-1 text-xs font-medium">
              {[4.5, 4.0, 3.0].map((star) => (
                <Link
                  key={star}
                  href={buildQueryUrl({ rating: star, page: 1 })}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-colors ${
                    activeRating === star ? 'bg-amber-50 font-bold text-amber-900' : 'hover:bg-stone-50'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{star} Stars & Above</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Catalog Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Bar Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs font-bold text-slate-900">
              Showing {products.length} of {total} {total === 1 ? 'item' : 'items'}
            </span>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-stone-500">Sort By:</span>
              <div className="flex gap-1">
                {[
                  { label: 'Featured', value: 'featured' },
                  { label: 'Price: Low', value: 'price-low' },
                  { label: 'Price: High', value: 'price-high' },
                  { label: 'Rating', value: 'rating' },
                ].map((s) => (
                  <Link
                    key={s.value}
                    href={buildQueryUrl({ sort: s.value, page: 1 })}
                    className={`px-3 py-1.5 rounded-xl transition-colors ${
                      activeSort === s.value ? 'bg-slate-900 text-white' : 'bg-stone-100 hover:bg-stone-200 text-slate-800'
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <ProductGrid
            products={products}
            emptyMessage="No products match your filter criteria. Try resetting filters to view all catalog items."
          />

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 text-xs font-bold">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={buildQueryUrl({ page: currentPage - 1 })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-stone-50 text-stone-400 cursor-not-allowed flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </span>
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={buildQueryUrl({ page: currentPage + 1 })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-stone-50 text-stone-400 cursor-not-allowed flex items-center gap-1">
                    Next <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
