'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="w-20 h-20 text-stone-300 mx-auto stroke-1" />
        <h1 className="text-2xl font-bold text-slate-900">Your Shopping Bag is empty</h1>
        <p className="text-sm text-stone-500 max-w-md mx-auto">
          Explore our collections to add high-performance electronics, horology, and apparel to your bag.
        </p>
        <Link href="/products" className="inline-block pt-2">
          <Button variant="primary" size="lg" className="bg-amber-600 hover:bg-amber-700">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 divide-y divide-stone-100">
            {cart.items.map((item) => (
              <div key={item.id} className="py-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0">
                  <SafeImage
                    src={item.product.images?.[0]?.imageUrl || ''}
                    categoryKey={item.product.categoryId || item.product.categorySlug}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                    {item.product.brand}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{item.product.title}</h3>
                  {item.selectedVariant && (
                    <p className="text-xs text-stone-500 font-medium">
                      Variant: {item.selectedVariant.title}
                    </p>
                  )}
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    ₹{item.unitPrice.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-6 self-between sm:self-auto w-full sm:w-auto justify-between">
                  <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 text-stone-600 hover:bg-stone-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-stone-600 hover:bg-stone-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-base font-extrabold text-slate-900 min-w-[100px] text-right">
                    ₹{item.totalPrice.toLocaleString('en-IN')}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-stone-400 hover:text-rose-600 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 h-fit">
          <h2 className="text-lg font-bold text-slate-900 border-b border-stone-100 pb-4">
            Order Summary
          </h2>
          <div className="space-y-3 text-sm text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Tax</span>
              <span>₹0.00</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 border-t border-stone-200 pt-3">
              <span>Total</span>
              <span className="text-amber-600">₹{cart.subtotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <Link href="/checkout" className="block w-full">
            <Button
              variant="primary"
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-700 font-bold justify-center"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
