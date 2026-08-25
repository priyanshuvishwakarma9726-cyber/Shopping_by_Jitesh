import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminRole } from '@/services/admin-service';
import { LayoutDashboard, Package, ShoppingCart, Users, FolderTree, Tag, BarChart3, Shield, AlertTriangle, Boxes, ExternalLink, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  const isAdmin = await verifyAdminRole(user.id);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-xs text-stone-600">
            Your account (<span className="font-bold text-slate-800">{user.email}</span>) does not have administrator privileges required to access the Admin Operations Center.
          </p>
          <div className="pt-2">
            <Link href="/account">
              <Button variant="primary" className="w-full bg-slate-900 justify-center">
                Back to Customer Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adminName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Administrator';

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-stone-300 p-6 flex-shrink-0 space-y-8">
        <div className="flex items-center gap-2.5 text-white">
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight leading-none">ADMIN PORTAL</h2>
            <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest mt-1">
              Shopping by Jitesh
            </p>
          </div>
        </div>

        <nav className="space-y-1.5 text-xs font-bold">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-amber-500" /> Dashboard Overview
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Package className="w-4 h-4 text-amber-500" /> Products Catalog
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <FolderTree className="w-4 h-4 text-amber-500" /> Categories
          </Link>
          <Link
            href="/admin/inventory"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Boxes className="w-4 h-4 text-amber-500" /> Inventory Stock
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ShoppingCart className="w-4 h-4 text-amber-500" /> Orders Management
          </Link>
          <Link
            href="/admin/customers"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Users className="w-4 h-4 text-amber-500" /> Customer Registry
          </Link>
          <Link
            href="/admin/coupons"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Tag className="w-4 h-4 text-amber-500" /> Discount Coupons
          </Link>
          <Link
            href="/admin/payment-settings"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Shield className="w-4 h-4 text-amber-500" /> Payment Settings
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-amber-500" /> Sales Analytics
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Bar */}
        <header className="bg-white border-b border-stone-200/80 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500">Admin Session:</span>
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-xl">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              {adminName} ({user.email})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 transition-colors text-xs font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
              <span>Visit Customer Store</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
