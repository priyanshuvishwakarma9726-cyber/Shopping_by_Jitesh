'use client';

import React from 'react';
import Link from 'next/link';
import { PackageCheck, Layers, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-stone-300 pt-14 pb-12 border-t border-slate-800">
      {/* Service Value Highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14 pb-10 border-b border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Verified Products</h4>
              <p className="text-[11px] text-stone-400">Authentic catalog items sourced directly from creators and distributors.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Wide Selection</h4>
              <p className="text-[11px] text-stone-400">Curated choices across consumer tech, apparel, horology, and home.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Direct Delivery</h4>
              <p className="text-[11px] text-stone-400">Standard logistics coverage supporting order tracking across India.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Help & Support</h4>
              <p className="text-[11px] text-stone-400">Online order updates and customer assistance portal.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-14">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-3">
          <Link href="/" className="flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-white">SHOPPING</span>
            <span className="text-xs font-semibold tracking-widest text-amber-500 uppercase">
              BY JITESH
            </span>
          </Link>
          <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
            Shopping by Jitesh is an online multi-category marketplace featuring consumer electronics, fashion, home living, timepieces, and wellness products.
          </p>
        </div>

        {/* Categories Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Categories</h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li><Link href="/category/electronics" className="hover:text-amber-400 transition-colors">Electronics</Link></li>
            <li><Link href="/category/apparel" className="hover:text-amber-400 transition-colors">Apparel & Fashion</Link></li>
            <li><Link href="/category/home-living" className="hover:text-amber-400 transition-colors">Home & Living</Link></li>
            <li><Link href="/category/watches-jewelry" className="hover:text-amber-400 transition-colors">Timepieces & Accessories</Link></li>
            <li><Link href="/category/wellness-gourmet" className="hover:text-amber-400 transition-colors">Beauty & Wellness</Link></li>
          </ul>
        </div>

        {/* Customer Care Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Store Navigation</h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li><Link href="/products" className="hover:text-amber-400 transition-colors">All Collections</Link></li>
            <li><Link href="/account/orders" className="hover:text-amber-400 transition-colors">Track Orders</Link></li>
            <li><Link href="/account" className="hover:text-amber-400 transition-colors">My Account</Link></li>
            <li><Link href="/cart" className="hover:text-amber-400 transition-colors">Shopping Bag</Link></li>
            <li><Link href="/wishlist" className="hover:text-amber-400 transition-colors">Saved Wishlist</Link></li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Updates</h4>
          <p className="text-xs text-stone-400">Receive store notifications and collection highlights.</p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-stone-500 text-xs"
            />
            <Button variant="secondary" className="w-full text-xs font-bold py-2 bg-amber-600 hover:bg-amber-700">
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
        <p>© {new Date().getFullYear()} Shopping by Jitesh. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/products" className="hover:text-stone-400">Products Catalog</Link>
          <Link href="/account" className="hover:text-stone-400">Account Portal</Link>
        </div>
      </div>
    </footer>
  );
};
