'use client';

import React from 'react';
import { WifiOff, RotateCw, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200 shadow-sm">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">You are offline</h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            Please check your network connection. Some live shopping actions (checkout, order tracking, and live catalog updates) require an active internet connection.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Button onClick={handleReload} variant="primary" className="w-full justify-center py-3 bg-amber-600 hover:bg-amber-700 text-white">
            <RotateCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Link href="/" className="inline-flex items-center justify-center text-xs font-semibold text-stone-500 hover:text-slate-900 transition-colors">
            <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
            Return to Storefront
          </Link>
        </div>
      </Card>
    </div>
  );
}
