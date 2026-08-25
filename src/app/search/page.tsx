import React from 'react';
import Link from 'next/link';
import { getProducts, getCategories } from '@/services/product-service';
import { ProductGrid } from '@/components/features/ProductGrid';
import { Sparkles, ArrowRight, Folder } from 'lucide-react';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

const COMMON_TYPOS: Record<string, string> = {
  'iphne': 'iPhone',
  'iphon': 'iPhone',
  'iphn': 'iPhone',
  'headphnes': 'headphones',
  'headfone': 'headphones',
  'headfones': 'headphones',
  'shose': 'shoes',
  'shoos': 'shoes',
  'sumsung': 'Samsung',
  'samsng': 'Samsung',
  'watche': 'watch',
  'curtain': 'curtains',
  'earpod': 'earbuds',
  'earpods': 'earbuds',
  'airpod': 'earbuds',
  'airpods': 'earbuds',
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams;
  const cleanQuery = q.trim();
  const lowerQ = cleanQuery.toLowerCase();
  const corrected = COMMON_TYPOS[lowerQ];

  const { products, total } = await getProducts({ searchQuery: cleanQuery });
  const categories = await getCategories();

  // If 0 results and typo is recognized, fetch products for corrected query
  let fallbackProducts = products;
  if (total === 0 && corrected) {
    const correctedRes = await getProducts({ searchQuery: corrected, pageSize: 8 });
    fallbackProducts = correctedRes.products;
  }

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

      {/* Typo Correction Banner if total is 0 or corrected query exists */}
      {corrected && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-amber-950">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Did you mean:</span>
            <Link
              href={`/search?q=${encodeURIComponent(corrected)}`}
              className="font-bold text-amber-700 hover:underline inline-flex items-center gap-1"
            >
              &ldquo;{corrected}&rdquo; <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Results Grid */}
      {total > 0 ? (
        <ProductGrid products={products} />
      ) : fallbackProducts.length > 0 ? (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-sm text-slate-700">
            No exact items found for &ldquo;{cleanQuery}&rdquo;. Showing suggested items for &ldquo;{corrected}&rdquo;:
          </div>
          <ProductGrid products={fallbackProducts} />
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              No products found for &ldquo;{cleanQuery}&rdquo;
            </h2>
            <p className="text-sm text-stone-500">
              We couldn&apos;t find any items matching your search. Explore our 10,000+ catalog by category below:
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 text-slate-900 hover:bg-amber-600 hover:text-white transition-colors text-xs font-bold"
              >
                <Folder className="w-3.5 h-3.5 opacity-70" />
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
