'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, User as UserIcon, Menu, X, PackageCheck, LogOut, Shield } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { verifyAdminRole } from '@/services/admin-service';
import { LiveSearchBar } from '@/components/features/LiveSearchBar';

export const Header: React.FC = () => {
  const { cart, openCartDrawer } = useCart();
  const { wishlistCount } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        verifyAdminRole(data.user.id).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        verifyAdminRole(session.user.id).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push('/');
    router.refresh();
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80">
      {/* Announcement Bar */}
      <div className="bg-slate-900 text-stone-200 text-xs py-2 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 font-medium truncate text-[11px] sm:text-xs">
            <PackageCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Shopping by Jitesh — Multi-Category Store</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-stone-300 shrink-0">
            <Link href="/account/orders" className="hover:text-amber-400 transition-colors">
              Track Order
            </Link>
            <span className="text-stone-700">|</span>
            <Link href="/products" className="hover:text-amber-400 transition-colors">
              All Products
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 w-full box-border">
        {/* Brand Logo */}
        <Link href="/" className="flex items-baseline gap-1 group shrink-0">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
            SHOPPING
          </span>
          <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-amber-600 uppercase">
            BY JITESH
          </span>
        </Link>

        {/* Desktop Live Search Experience */}
        <Suspense fallback={<div className="hidden md:flex flex-1 max-w-md mx-4" />}>
          <LiveSearchBar className="hidden md:flex max-w-md mx-4" />
        </Suspense>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Wishlist Link (Desktop/Tablet - Mobile has bottom nav) */}
          <Link
            href="/wishlist"
            className="hidden sm:flex relative p-2 text-stone-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-stone-100 items-center gap-1 text-xs font-semibold"
            title="Saved Wishlist"
          >
            <Heart className="w-5 h-5 text-stone-700" />
            <span className="hidden md:inline">Wishlist</span>
            {mounted && wishlistCount > 0 && (
              <Badge variant="brand" className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-amber-600 text-white">
                {wishlistCount}
              </Badge>
            )}
          </Link>

          {/* Cart Trigger */}
          <button
            onClick={openCartDrawer}
            className="relative p-1.5 sm:p-2 text-stone-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-stone-100 flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-slate-900" />
              {mounted && cart.itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-amber-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.itemCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-bold text-slate-900">
              ₹{(mounted ? cart.total : 0).toLocaleString('en-IN')}
            </span>
          </button>

          {/* Customer Account Identity / Login */}
          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors text-xs font-bold shadow-sm"
                  title="Admin Dashboard"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}
              <Link
                href="/account"
                className="flex items-center gap-1 p-1.5 sm:p-2 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors text-xs font-bold text-slate-900"
              >
                <UserIcon className="w-4 h-4 text-amber-600" />
                <span className="hidden md:inline max-w-xs truncate">{userName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-stone-500 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-xs font-bold"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-stone-600 hover:text-slate-900 rounded-xl hover:bg-stone-100 shrink-0 cursor-pointer ml-1"
            aria-label="Toggle Mobile Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 p-4 space-y-4">
          <Suspense fallback={<div className="w-full h-10 bg-stone-100 rounded-xl" />}>
            <LiveSearchBar isMobile onNavigate={() => setIsMobileMenuOpen(false)} />
          </Suspense>

          <nav className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-amber-600">Home</Link>
            <Link href="/products" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-amber-600">All Catalog Products</Link>
            <Link href="/category/electronics" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-amber-600">Electronics</Link>
            <Link href="/category/apparel" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-amber-600">Apparel & Fashion</Link>
            <Link href="/category/home-living" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-amber-600">Home & Living</Link>
            {user ? (
              <>
                <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-slate-900 font-bold">My Account ({userName})</Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-amber-600 font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> Admin Portal Dashboard
                  </Link>
                )}
              </>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-amber-600 font-bold">Sign In / Register</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
