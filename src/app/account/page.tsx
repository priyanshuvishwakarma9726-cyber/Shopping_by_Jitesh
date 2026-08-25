import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, MapPin, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateDbUser } from '@/services/user-service';

export default async function AccountDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?next=/account');
  }

  const dbUser = await getOrCreateDbUser(
    authUser.id,
    authUser.email || '',
    authUser.user_metadata?.full_name || 'Valued Customer'
  );

  const customerName = dbUser?.fullName || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Customer';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-400" /> Verified Customer Account
        </span>
        <h1 className="text-3xl font-black tracking-tight">Welcome Back, {customerName}</h1>
        <p className="text-sm text-stone-300">
          Manage your orders, saved shipping addresses, and personal security profile.
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/account/orders">
          <Card hoverable className="space-y-4">
            <div className="p-3 w-fit rounded-2xl bg-amber-50 text-amber-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                My Orders <ArrowRight className="w-4 h-4 text-stone-400" />
              </h3>
              <p className="text-xs text-stone-500 mt-1">Your placed orders will appear here.</p>
            </div>
          </Card>
        </Link>

        <Link href="/account/addresses">
          <Card hoverable className="space-y-4">
            <div className="p-3 w-fit rounded-2xl bg-amber-50 text-amber-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                Saved Addresses <ArrowRight className="w-4 h-4 text-stone-400" />
              </h3>
              <p className="text-xs text-stone-500 mt-1">Manage home, work, and delivery addresses.</p>
            </div>
          </Card>
        </Link>

        <Link href="/account/profile">
          <Card hoverable className="space-y-4">
            <div className="p-3 w-fit rounded-2xl bg-amber-50 text-amber-600">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                Profile & Security <ArrowRight className="w-4 h-4 text-stone-400" />
              </h3>
              <p className="text-xs text-stone-500 mt-1">Update personal contact details.</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
