import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/services/product-service';
import { Star, ChevronRight, PackageCheck, Layers, RefreshCw, Star as StarFill } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ProductDetailActions } from './product-detail-actions';
import { ProductGrid } from '@/components/features/ProductGrid';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(slug, product.categorySlug);
  const primaryImage = product.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500 overflow-x-auto pb-1">
        <Link href="/" className="hover:text-amber-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <Link href="/products" className="hover:text-amber-600">Products</Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <Link href={`/category/${product.categorySlug}`} className="hover:text-amber-600">
          {product.categoryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-slate-900 truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Product Main Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Gallery Column */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-xs">
            <Image
              src={primaryImage}
              alt={product.title}
              fill
              priority
              className="object-cover"
            />
            {hasDiscount && (
              <Badge variant="brand" className="absolute top-4 left-4 bg-amber-600 text-white font-bold border-0 text-xs px-3 py-1">
                -{discountPercent}% DISCOUNT
              </Badge>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <div
                  key={img.id}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white border border-stone-200 flex-shrink-0 cursor-pointer hover:border-amber-500 transition-colors"
                >
                  <Image src={img.imageUrl} alt={img.altText || ''} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="brand">{product.brand}</Badge>
              <Badge variant="neutral">SKU: {product.sku}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {product.title}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-500" />
                <span>{product.averageRating}</span>
              </div>
              <span className="text-xs text-stone-400">|</span>
              <span className="text-xs font-semibold text-stone-600">
                {product.reviewCount} Reviews
              </span>
              <span className="text-xs text-stone-400">|</span>
              <span className="text-xs font-bold text-emerald-600">In Stock</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-stone-100 p-5 rounded-2xl border border-stone-200/80 flex items-baseline gap-4">
            <span className="text-3xl font-black text-slate-900">
              ₹{(product.salePrice ?? product.basePrice).toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm font-semibold text-stone-400 line-through">
                  ₹{product.basePrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-200/60 px-2.5 py-1 rounded-lg">
                  Save ₹{(product.basePrice - product.salePrice!).toLocaleString('en-IN')}
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-stone-600 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Interactive Client Actions */}
          <ProductDetailActions product={product} />

          {/* Service Guarantees */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-200 text-xs font-semibold text-stone-700">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-amber-600" />
              <span>Verified Item</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Quality Sourced</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Direct Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Overview */}
      <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-stone-100 pb-4">
          Product Details & Specifications
        </h2>
        <div className="prose max-w-none text-sm text-stone-700 space-y-4 whitespace-pre-line leading-relaxed">
          {product.description}
        </div>
      </div>

      {/* Customer Reviews Shell */}
      <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Customer Ratings & Reviews</h2>
            <p className="text-xs text-stone-500">Based on {product.reviewCount} customer ratings</p>
          </div>
          <div className="flex items-center gap-1 text-amber-500 font-bold text-lg">
            <StarFill className="w-5 h-5 fill-amber-500" />
            <span>{product.averageRating} / 5</span>
          </div>
        </div>

        <div className="space-y-4 text-xs text-stone-600">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Verified Customer</span>
              <span className="text-amber-500">★ 5.0</span>
            </div>
            <p className="text-stone-700 font-medium">Exceeded expectations. Very fast delivery and excellent quality.</p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight border-b border-stone-200 pb-4">
            Related Products
          </h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
    </div>
  );
}
