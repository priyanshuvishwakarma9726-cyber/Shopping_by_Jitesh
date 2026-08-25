'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User as UserIcon, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/context/toast-context';
import { NotificationToggle } from '@/components/pwa/NotificationToggle';
import { updateUserProfile } from '@/services/user-service';

export default function ProfilePage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');

  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setEmail(data.user.email || '');
        setFullName(data.user.user_metadata?.full_name || '');
        setPhone(data.user.user_metadata?.phone || '');
      }
      setLoading(false);
    });
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('Please provide your full name.', 'error');
      return;
    }

    setSaving(true);

    try {
      // Update Supabase User Metadata
      await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      });

      // Update TiDB User Table
      if (userId) {
        await updateUserProfile(userId, {
          fullName: fullName.trim(),
          phone: phone.trim(),
        });
      }

      showToast('Profile updated successfully!', 'success');
    } catch {
      showToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-xs font-bold text-stone-500">
        Loading profile details...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-amber-600">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Profile</h1>
        <p className="text-sm text-stone-500">Update your personal contact details</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6 shadow-sm">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email Address (Read-only)</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-stone-100 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-500 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-stone-400">Email is managed by your authentication provider.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <NotificationToggle />
        </div>

        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <Link href="/account">
            <Button type="button" variant="outline" className="text-xs font-bold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            isLoading={saving}
          >
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
