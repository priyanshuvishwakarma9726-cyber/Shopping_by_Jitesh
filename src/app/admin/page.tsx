import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminDashboardStats } from '@/services/admin-service';
import { ShoppingBag, Users, AlertTriangle, Package, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  const stats = await getAdminDashboardStats(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Operations Center</h1>
        <p className="text-xs text-stone-500 font-semibold">Live platform revenue, order fulfillment, and catalog inventory metrics</p>
      </div>

      {/* Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="space-y-2 border border-stone-200">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              ₹
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">₹{stats.confirmedRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-medium text-stone-500">Excludes pending/rejected payments</p>
        </Card>

        <Card className="space-y-2 border border-stone-200">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalOrders}</p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-amber-600 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" /> {stats.pendingPayments} pending
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-emerald-600 font-bold">{stats.confirmedOrders} confirmed</span>
          </div>
        </Card>

        <Card className="space-y-2 border border-stone-200">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Customers</span>
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalCustomers}</p>
          <p className="text-[11px] font-medium text-stone-500">Registered store accounts</p>
        </Card>

        <Card className="space-y-2 border border-stone-200">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Catalog & Inventory</span>
            <Package className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalProducts} Products</p>
          <div className="flex items-center gap-2 text-[11px]">
            {stats.lowStockProducts > 0 || stats.outOfStockProducts > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {stats.lowStockProducts + stats.outOfStockProducts} need restock
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Stock levels healthy
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Real Orders */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Customer Orders</h2>
            <p className="text-xs text-stone-500">Latest orders submitted for store processing</p>
          </div>
          <Link href="/admin/orders" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No recent orders found</p>
            <p className="text-xs text-stone-500">Customer purchase orders will appear here in real time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                {stats.recentOrders.map((item) => (
                  <tr key={item.order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{item.order.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{item.customerName}</p>
                        <p className="text-[10px] text-stone-500">{item.customerEmail}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{item.order.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      {item.order.status === 'confirmed' && <Badge variant="success">Confirmed</Badge>}
                      {item.order.status === 'payment_pending' && <Badge variant="warning">Payment Pending</Badge>}
                      {item.order.status === 'payment_rejected' && <Badge variant="danger">Payment Rejected</Badge>}
                      {item.order.status === 'shipped' && <Badge variant="brand">Shipped</Badge>}
                      {item.order.status === 'delivered' && <Badge variant="success">Delivered</Badge>}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.payment.status === 'approved' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : item.payment.status === 'rejected' ? (
                        <span className="text-rose-700 font-bold">Rejected</span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Verification Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders?id=${item.order.id}`}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-slate-900 hover:text-white transition-colors font-bold"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
