import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminCustomerDetail } from '@/services/customer-service';
import { ArrowLeft, Calendar, Mail, MapPin, ShoppingBag, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  const detail = await getAdminCustomerDetail(user.id, customerId);

  if (!detail) {
    return (
      <div className="space-y-6">
        <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-amber-600">
          <ArrowLeft className="w-4 h-4" /> Back to Customer Registry
        </Link>
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-sm font-bold text-slate-800">
          Customer account record not found.
        </div>
      </div>
    );
  }

  const { customer, orders, addresses } = detail;

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-amber-600">
        <ArrowLeft className="w-4 h-4" /> Back to Customer Registry
      </Link>

      {/* Customer Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 font-black text-xl flex items-center justify-center border border-amber-200">
            {customer.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{customer.fullName}</h1>
            <div className="flex items-center gap-4 text-xs text-stone-500 font-semibold mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-600" /> {customer.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" /> Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <Badge variant="brand" className="px-3 py-1 text-xs">CUSTOMER ACCOUNT</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Delivery Addresses */}
        <Card className="space-y-4 border border-stone-200 lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600" /> Saved Delivery Addresses ({addresses.length})
          </h3>

          {addresses.length === 0 ? (
            <p className="text-xs text-stone-500">No saved addresses on file.</p>
          ) : (
            <div className="space-y-3 divide-y divide-stone-100 text-xs">
              {addresses.map((addr) => (
                <div key={addr.id} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{addr.fullName}</span>
                    {addr.isDefault && <Badge variant="success">DEFAULT</Badge>}
                  </div>
                  <p className="text-stone-600">{addr.streetAddress}, {addr.apartment || ''}</p>
                  <p className="text-stone-600">{addr.city}, {addr.state} — {addr.postalCode}</p>
                  <p className="text-stone-400 font-mono text-[10px]">Phone: {addr.phoneNumber}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Order History */}
        <Card className="space-y-4 border border-stone-200 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-600" /> Order History ({orders.length})
          </h3>

          {orders.length === 0 ? (
            <p className="text-xs text-stone-500">No orders placed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Order Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3">
                        {o.status === 'confirmed' && (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                          </span>
                        )}
                        {o.status === 'payment_pending' && (
                          <span className="text-amber-700 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                        {o.status === 'payment_rejected' && <span className="text-rose-700 font-bold">Rejected</span>}
                      </td>
                      <td className="py-3 px-3 text-stone-500">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
