'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserOrders } from '@/services/order-service';
import { Order } from '@/types';
import { ArrowLeft, Package, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function CustomerOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const userOrders = await getUserOrders(session.user.id);
        setOrders(userOrders);
      }
      setLoading(false);
    }

    loadOrders();
  }, [supabase.auth]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'payment_pending':
        return <Badge variant="warning">Payment Verification Pending</Badge>;
      case 'payment_rejected':
        return <Badge variant="danger">Payment Rejected</Badge>;
      case 'shipped':
        return <Badge variant="brand">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      default:
        return <Badge variant="neutral">{status.toUpperCase()}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-stone-500 font-semibold">Loading Order History...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/account">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Your Order History</h1>
          <p className="text-xs text-stone-500">Track and review all purchases placed on Shopping by Jitesh</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
          <Package className="w-16 h-16 text-stone-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">No Orders Placed Yet</h2>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Explore our multi-category online store and place your first order.
          </p>
          <Link href="/products">
            <Button variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Browse Catalog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block bg-white rounded-2xl border border-stone-200 hover:border-amber-600/50 p-6 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-900">{order.orderNumber}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">Total Amount</span>
                    <span className="text-base font-black text-amber-600">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
