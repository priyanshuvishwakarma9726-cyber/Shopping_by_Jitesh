'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getAdminCustomers, AdminCustomerView } from '@/services/customer-service';
import { Users, Search, Loader2, Calendar, ShoppingBag, Eye } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user && isMounted) {
          const res = await getAdminCustomers(data.user.id, search);
          if (isMounted) setCustomers(res);
        }
      } catch {
        // Handle error
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [search, supabase.auth]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-600" /> Customer Registry
        </h1>
        <p className="text-xs text-stone-500 font-semibold">Registered customer accounts, purchase frequency, and lifetime store spent</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customer Registry Table */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-stone-500 font-semibold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> Querying customer registry from TiDB...
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No registered customers found</p>
            <p className="text-xs text-stone-500">Customer profiles will appear here when users create accounts on your store.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Lifetime Spent</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                {customers.map((c) => (
                  <tr key={c.customer.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.customer.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-stone-600">{c.customer.email}</td>
                    <td className="py-3.5 px-4 text-stone-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {new Date(c.customer.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                        {c.orderCount} orders
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{c.totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/customers/${c.customer.id}`}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-slate-900 hover:text-white transition-colors font-bold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Profile
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
