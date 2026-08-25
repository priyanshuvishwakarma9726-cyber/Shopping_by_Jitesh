'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { cart, openCartDrawer } = useCart();
  const { wishlistCount } = useWishlist();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Catalog', href: '/products', icon: Grid },
    { label: 'Saved', href: '/wishlist', icon: Heart, badge: wishlistCount },
    { label: 'Account', href: '/account', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] px-1 sm:px-4 shadow-lg w-full max-w-full overflow-hidden box-border">
      <div className="grid grid-cols-5 w-full max-w-full items-center text-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold relative transition-colors py-1 ${
                isActive ? 'text-amber-600' : 'text-stone-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate max-w-full px-0.5 text-[10px]">{item.label}</span>
              {mounted && item.badge ? (
                <span className="absolute -top-1 right-1 sm:right-2 bg-amber-600 text-white text-[9px] font-bold px-1.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}

        {/* Cart Trigger */}
        <button
          onClick={openCartDrawer}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-stone-500 hover:text-slate-900 relative cursor-pointer py-1"
        >
          <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="truncate max-w-full px-0.5 text-[10px]">Bag</span>
          {mounted && cart.itemCount > 0 && (
            <span className="absolute -top-1 right-1 sm:right-2 bg-amber-600 text-white text-[9px] font-bold px-1.5 rounded-full">
              {cart.itemCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
