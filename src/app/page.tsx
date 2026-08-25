import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, PackageCheck, Layers, RefreshCw, HelpCircle, Flame, Star, Tag } from 'lucide-react';
import {
  getHomepageProductSections,
  getCategories,
} from '@/services/product-service';
import { ProductGrid } from '@/components/features/ProductGrid';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [{ heroProduct, featuredProducts, trendingProducts, bestSellers, dealProducts }, categories] =
    await Promise.all([
      getHomepageProductSections(8),
      getCategories(),
    ]);

  const showcaseImage = heroProduct?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop';
  const showcaseTitle = heroProduct?.title || 'Aura Studio ANC Headphones';
  const showcasePrice = heroProduct ? (heroProduct.salePrice || heroProduct.basePrice) : 19999;
  const showcaseBasePrice = heroProduct?.salePrice ? heroProduct.basePrice : null;
  const showcaseCategory = heroProduct?.categoryName || 'Store Showcase';
  const showcaseHref = heroProduct ? `/products/${heroProduct.slug}` : '/products';
  const discountPercent = showcaseBasePrice && heroProduct?.salePrice
    ? Math.round(((showcaseBasePrice - heroProduct.salePrice) / showcaseBasePrice) * 100)
    : null;

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#D97706_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-4 h-4" /> Multi-Category Online Marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Quality Products for Every Lifestyle.
            </h1>
            <p className="text-base sm:text-lg text-stone-300 max-w-xl leading-relaxed">
              Explore over 1,000+ curated electronics, tailored apparel, home decor, timepieces, and wellness essentials. Simple, fast online shopping.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/products">
                <Button
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Explore All Collections
                </Button>
              </Link>
              <Link href="/category/electronics">
                <Button size="lg" variant="outline" className="border-slate-700 text-white bg-slate-800/80 hover:bg-slate-800">
                  Shop Electronics
                </Button>
              </Link>
            </div>
          </div>

          <Link href={showcaseHref} className="group block relative aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 transition-transform duration-500 hover:scale-[1.01]">
            <SafeImage
              src={showcaseImage}
              categoryKey={heroProduct?.categoryId || heroProduct?.categorySlug}
              alt={showcaseTitle}
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
            
            {discountPercent && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black tracking-wider shadow-lg">
                -{discountPercent}% OFF
              </div>
            )}

            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider truncate">{showcaseCategory}</p>
                <p className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">{showcaseTitle}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm sm:text-base font-extrabold text-amber-400">
                  ₹{showcasePrice.toLocaleString('en-IN')}
                </div>
                {showcaseBasePrice && (
                  <div className="text-[11px] text-stone-400 line-through">
                    ₹{showcaseBasePrice.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 2. Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              Browse Categories
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Departments
            </h2>
          </div>
          <Link href="/products" className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            View All ({categories.length}) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-16/10 bg-slate-900 border border-stone-200 shadow-xs hover:shadow-xl transition-all"
            >
              <SafeImage
                src={cat.imageUrl || ''}
                categoryKey={cat.id || cat.slug}
                alt={cat.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  {cat.productCount || 10} Products
                </span>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-stone-300 line-clamp-1">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              Store Collections
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Products
            </h2>
          </div>
          <Link href="/products" className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            Browse All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ProductGrid products={featuredProducts} />
      </section>

      {/* 4. Trending Products */}
      <section className="bg-stone-100 py-16 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-300/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                  Popular Demands
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Trending Now
                </h2>
              </div>
            </div>
            <Link href="/products?sort=rating" className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              View Highest Rated <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <ProductGrid products={trendingProducts} />
        </div>
      </section>

      {/* 5. Best Sellers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                Customer Favorites
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Best-Selling Picks
              </h2>
            </div>
          </div>
          <Link href="/products" className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            See All Items <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ProductGrid products={bestSellers} />
      </section>

      {/* 6. Today's Highlights / Deals Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Featured Offers
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Today&apos;s Highlights
                </h2>
              </div>
            </div>
            <Link href="/products">
              <Button variant="secondary" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                Explore Special Prices
              </Button>
            </Link>
          </div>

          <ProductGrid products={dealProducts} />
        </div>
      </section>

      {/* 7. Factual Trust & Service Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Verified Products</h3>
              <p className="text-xs text-stone-500">Authentic items sourced from distributors.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Multi-Category Store</h3>
              <p className="text-xs text-stone-500">Wide catalog covering tech, apparel & home.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Direct Delivery</h3>
              <p className="text-xs text-stone-500">Logistics dispatch with order tracking.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Assistance Portal</h3>
              <p className="text-xs text-stone-500">Customer account & order updates.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
