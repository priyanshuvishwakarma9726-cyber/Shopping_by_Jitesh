'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/Button';

export const CartDrawer: React.FC = () => {
  const { cart, isDrawerOpen, closeCartDrawer, updateQuantity, removeFromCart } = useCart();

  if (!isDrawerOpen) return null;

  const freeShippingThreshold = 3000;
  const progressToFreeShipping = Math.min(
    100,
    Math.round((cart.subtotal / freeShippingThreshold) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={closeCartDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">Your Shopping Bag</h2>
              <span className="text-xs font-semibold text-stone-500">
                ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
              </span>
            </div>
            <button
              onClick={closeCartDrawer}
              className="p-2 rounded-xl text-stone-400 hover:text-slate-900 hover:bg-stone-200 transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-amber-50 border-b border-amber-200/60 p-4 text-xs">
            <div className="flex justify-between font-semibold text-slate-800 mb-1.5">
              <span>
                {cart.subtotal >= freeShippingThreshold
                  ? '🎉 You unlocked FREE Express Shipping!'
                  : `Add ₹${(freeShippingThreshold - cart.subtotal).toLocaleString('en-IN')} more for FREE Express Shipping`}
              </span>
              <span>{progressToFreeShipping}%</span>
            </div>
            <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-stone-100">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <ShoppingBag className="w-16 h-16 text-stone-300 mb-4 stroke-1" />
                <p className="text-base font-bold text-slate-900 mb-1">Your bag is empty</p>
                <p className="text-xs text-stone-500 mb-6">
                  Explore our luxury tech, apparel, and timepieces to add items.
                </p>
                <Button onClick={closeCartDrawer} variant="primary" size="md">
                  Explore Catalog
                </Button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                    <Image
                      src={item.product.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {item.product.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.selectedVariant && (
                        <p className="text-xs text-stone-500 font-medium">
                          Variant: {item.selectedVariant.title}
                        </p>
                      )}
                      <p className="text-sm font-bold text-amber-700 mt-1">
                        ₹{item.unitPrice.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 text-stone-600 hover:bg-stone-100 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 text-stone-600 hover:bg-stone-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{item.totalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {cart.items.length > 0 && (
            <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">
              <div className="space-y-2 text-sm text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    ₹{cart.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Shipping Fee</span>
                  <span className="font-medium text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Estimated Tax</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-stone-200 pt-2">
                  <span>Total</span>
                  <span className="text-amber-700">₹{cart.subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link href="/cart" onClick={closeCartDrawer} className="w-full">
                  <Button variant="outline" className="w-full justify-center">
                    View Bag
                  </Button>
                </Link>
                <Link href="/checkout" onClick={closeCartDrawer} className="w-full">
                  <Button
                    variant="primary"
                    className="w-full justify-center bg-amber-600 hover:bg-amber-700 text-white"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Checkout
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
