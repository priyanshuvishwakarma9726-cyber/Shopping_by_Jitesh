import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminAnalytics } from '@/services/analytics-service';
import { BarChart3, ShoppingBag, FolderTree, Trophy, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  const data = await getAdminAnalytics(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-amber-600" /> Sales & Store Performance Analytics
        </h1>
        <p className="text-xs text-stone-500 font-semibold">Real TiDB revenue breakdown, category sales performance, and top catalog SKUs</p>
      </div>

      {/* Revenue & Fulfillment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="space-y-2 border border-stone-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Confirmed Revenue</span>
          <p className="text-2xl font-black text-slate-900">₹{data.confirmedRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved payment orders
          </p>
        </Card>

        <Card className="space-y-2 border border-stone-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Pending Revenue</span>
          <p className="text-2xl font-black text-amber-700">₹{data.pendingRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Awaiting payment verification
          </p>
        </Card>

        <Card className="space-y-2 border border-stone-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Store Orders</span>
          <p className="text-2xl font-black text-slate-900">{data.totalOrders}</p>
          <p className="text-[11px] font-semibold text-stone-500">{data.confirmedOrders} confirmed / {data.pendingOrders} pending</p>
        </Card>

        <Card className="space-y-2 border border-stone-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Rejected / Cancelled</span>
          <p className="text-2xl font-black text-rose-700">{data.rejectedOrders + data.cancelledOrders}</p>
          <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Excluded from store revenue
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-amber-600" /> Category Performance Breakdown
          </h3>

          {data.categoryBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500 font-semibold space-y-1">
              <FolderTree className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="font-bold text-slate-800">No category sales recorded yet</p>
              <p>Confirmed customer orders will populate category revenue metrics.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Orders</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                  {data.categoryBreakdown.map((cat) => (
                    <tr key={cat.categoryId} className="hover:bg-stone-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{cat.categoryName}</td>
                      <td className="py-3 px-3 text-stone-600">{cat.orderCount} orders</td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">₹{cat.revenue.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" /> Top Best Selling Products
          </h3>

          {data.topProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500 font-semibold space-y-1">
              <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="font-bold text-slate-800">No product sales recorded yet</p>
              <p>Top performing products will be ranked here by sales volume.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Product Title</th>
                    <th className="py-2.5 px-3">Units Sold</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                  {data.topProducts.map((p) => (
                    <tr key={p.productId} className="hover:bg-stone-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{p.productTitle}</td>
                      <td className="py-3 px-3 text-stone-600">
                        <Badge variant="brand">{p.unitsSold} units</Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">₹{p.revenueGenerated.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
