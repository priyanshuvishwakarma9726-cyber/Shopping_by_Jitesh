'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2, Sparkles, Folder, ArrowRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { SearchSuggestionsResult } from '@/services/product-service';

export interface LiveSearchBarProps {
  placeholder?: string;
  className?: string;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export const LiveSearchBar: React.FC<LiveSearchBarProps> = ({
  placeholder = 'Search products across all categories...',
  className = '',
  isMobile = false,
  onNavigate,
}) => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const [queryText, setQueryText] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Create flat list of selectable items for keyboard navigation
  const selectableItems = React.useMemo(() => {
    if (!suggestions) return [];
    const items: { type: 'category' | 'query' | 'product'; data: unknown; href: string }[] = [];

    if (suggestions.correctedQuery) {
      items.push({
        type: 'query',
        data: suggestions.correctedQuery,
        href: `/search?q=${encodeURIComponent(suggestions.correctedQuery)}`,
      });
    }

    suggestions.categories.forEach((c) => {
      items.push({
        type: 'category',
        data: c,
        href: `/category/${c.slug}`,
      });
    });

    suggestions.querySuggestions.forEach((q) => {
      items.push({
        type: 'query',
        data: q,
        href: `/search?q=${encodeURIComponent(q)}`,
      });
    });

    suggestions.products.forEach((p) => {
      items.push({
        type: 'product',
        data: p,
        href: `/products/${p.slug}`,
      });
    });

    return items;
  }, [suggestions]);

  // Debounced live fetch
  useEffect(() => {
    const trimmed = queryText.trim();
    if (trimmed.length < 2) {
      const timer = setTimeout(() => {
        setSuggestions(null);
        setLoading(false);
        setSelectedIndex(-1);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data: SearchSuggestionsResult = await res.json();
          setSuggestions(data);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.warn('[LiveSearchBar] Suggestions fetch error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [queryText]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetQuery = (selectedIndex >= 0 && selectableItems[selectedIndex]?.type === 'query')
      ? (selectableItems[selectedIndex].data as string)
      : queryText.trim();

    if (targetQuery) {
      setIsOpen(false);
      if (onNavigate) onNavigate();
      router.push(`/search?q=${encodeURIComponent(targetQuery)}`);
    }
  }, [selectedIndex, selectableItems, queryText, onNavigate, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || selectableItems.length === 0) {
      if (e.key === 'Enter') {
        handleSearchSubmit(e);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < selectableItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : selectableItems.length - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < selectableItems.length) {
        const item = selectableItems[selectedIndex];
        setIsOpen(false);
        if (onNavigate) onNavigate();
        router.push(item.href);
      } else {
        handleSearchSubmit();
      }
    }
  };

  const hasAnyResults =
    suggestions &&
    (suggestions.products.length > 0 ||
      suggestions.categories.length > 0 ||
      suggestions.querySuggestions.length > 0 ||
      Boolean(suggestions.correctedQuery));

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onFocus={() => {
            if (queryText.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-stone-100 hover:bg-stone-50 focus:bg-white border border-stone-200 focus:border-amber-500 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
          autoComplete="off"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {loading && (
            <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          )}
          {queryText && !loading && (
            <button
              type="button"
              onClick={() => {
                setQueryText('');
                setSuggestions(null);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 text-stone-400 hover:text-slate-900 transition-colors rounded-full"
              aria-label="Clear search text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete Dropdown Popover */}
      {isOpen && queryText.trim().length >= 2 && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden z-50 divide-y divide-stone-100 max-h-[80vh] sm:max-h-[500px] overflow-y-auto ${
            isMobile ? 'w-full' : 'min-w-[360px] sm:min-w-[420px]'
          }`}
        >
          {/* Typo Correction Banner */}
          {suggestions?.correctedQuery && (
            <div className="p-3 bg-amber-50/80 border-b border-amber-100/80 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Did you mean:</span>
                <button
                  type="button"
                  onClick={() => {
                    setQueryText(suggestions.correctedQuery!);
                  }}
                  className="font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  &ldquo;{suggestions.correctedQuery}&rdquo;
                </button>
                <span>?</span>
              </div>
            </div>
          )}

          {/* Categories Suggestions */}
          {suggestions && suggestions.categories.length > 0 && (
            <div className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 block mb-1.5">
                Categories
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.categories.map((cat) => {
                  const itemIndex = selectableItems.findIndex(
                    (item) => item.type === 'category' && (item.data as { id: string }).id === cat.id
                  );
                  const isHighlighted = selectedIndex === itemIndex;

                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      onClick={() => {
                        setIsOpen(false);
                        if (onNavigate) onNavigate();
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        isHighlighted
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 text-slate-800 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span>{cat.name}</span>
                      {cat.productCount !== undefined && cat.productCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isHighlighted ? 'bg-amber-700 text-white' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {cat.productCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Phrase Suggestions */}
          {suggestions && suggestions.querySuggestions.length > 0 && (
            <div className="p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3 block mb-1">
                Suggested Searches
              </span>
              <div className="space-y-0.5">
                {suggestions.querySuggestions.map((phrase) => {
                  const itemIndex = selectableItems.findIndex(
                    (item) => item.type === 'query' && item.data === phrase
                  );
                  const isHighlighted = selectedIndex === itemIndex;

                  return (
                    <Link
                      key={phrase}
                      href={`/search?q=${encodeURIComponent(phrase)}`}
                      onClick={() => {
                        setIsOpen(false);
                        if (onNavigate) onNavigate();
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isHighlighted
                          ? 'bg-amber-50 text-amber-900 font-bold'
                          : 'text-slate-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Search className="w-3.5 h-3.5 text-stone-400" />
                        <span>{phrase}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 opacity-60" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products Suggestions */}
          {suggestions && suggestions.products.length > 0 && (
            <div className="p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3 block mb-1">
                Products ({suggestions.products.length})
              </span>
              <div className="space-y-1">
                {suggestions.products.map((p) => {
                  const itemIndex = selectableItems.findIndex(
                    (item) => item.type === 'product' && (item.data as { id: string }).id === p.id
                  );
                  const isHighlighted = selectedIndex === itemIndex;
                  const hasDiscount = p.salePrice && p.salePrice < p.basePrice;

                  return (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      onClick={() => {
                        setIsOpen(false);
                        if (onNavigate) onNavigate();
                      }}
                      className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                        isHighlighted
                          ? 'bg-amber-50/80 border border-amber-200/80'
                          : 'hover:bg-stone-50 border border-transparent'
                      }`}
                    >
                      {/* Product Thumbnail with SafeImage */}
                      <div className="relative w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                        <SafeImage
                          src={p.imageUrl}
                          categoryKey={p.categoryId || p.categorySlug}
                          alt={p.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider truncate">
                            {p.brand}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {p.title}
                        </h4>
                        <div className="flex items-baseline gap-1.5 text-xs">
                          <span className="font-extrabold text-slate-900">
                            ₹{(p.salePrice ?? p.basePrice).toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-stone-400 line-through">
                              ₹{p.basePrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-stone-300 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results Fallback State */}
          {!loading && !hasAnyResults && (
            <div className="p-6 text-center space-y-2">
              <Search className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-slate-900">
                No products found for &ldquo;{queryText}&rdquo;
              </p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Try searching for popular categories like <Link href="/category/electronics" className="text-amber-600 hover:underline">Electronics</Link>, <Link href="/category/apparel" className="text-amber-600 hover:underline">Apparel</Link>, or browse our <Link href="/products" className="text-amber-600 hover:underline">10,000+ Catalog</Link>.
              </p>
            </div>
          )}

          {/* Bottom View All Link */}
          {hasAnyResults && (
            <div className="p-2.5 bg-stone-50 text-center">
              <Link
                href={`/search?q=${encodeURIComponent(queryText.trim())}`}
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigate) onNavigate();
                }}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center justify-center gap-1.5"
              >
                View all search results for &ldquo;{queryText.trim()}&rdquo; <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
