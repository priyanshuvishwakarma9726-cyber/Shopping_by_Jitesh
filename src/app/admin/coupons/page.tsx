'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAdminCoupons, createCoupon, toggleCouponActive } from '@/services/coupon-service';
import { Coupon } from '@/types';
import { Tag, Plus, Power, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/toast-context';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minimumOrderAmount, setMinimumOrderAmount] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const res = await getAdminCoupons(data.user.id);
        setCoupons(res);
      }
    } catch {
      showToast('Failed to load coupons.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user && isMounted) {
          const res = await getAdminCoupons(data.user.id);
          if (isMounted) setCoupons(res);
        }
      } catch {
        if (isMounted) showToast('Failed to load coupons.', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [showToast, supabase.auth]);

  const openCreateModal = () => {
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinimumOrderAmount('0');
    setMaxDiscountAmount('');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setValidUntil(defaultDate.toISOString().split('T')[0]);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(discountValue);
    const minAmt = parseFloat(minimumOrderAmount) || 0;
    const maxDiscount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined;

    if (!code.trim()) {
      showToast('Coupon code is required.', 'error');
      return;
    }

    if (isNaN(val) || val <= 0) {
      showToast('Discount value must be greater than zero.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const res = await createCoupon(data.user.id, {
        code,
        description,
        discountType,
        discountValue: val,
        minimumOrderAmount: minAmt,
        maxDiscountAmount: maxDiscount,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        isActive,
      });

      if (res.success) {
        showToast(`Coupon code '${code.toUpperCase()}' created successfully!`, 'success');
        setIsModalOpen(false);
        loadData();
      } else {
        showToast(res.error || 'Failed to create coupon.', 'error');
      }
    } catch {
      showToast('Error creating coupon.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const res = await toggleCouponActive(data.user.id, c.id, !c.isActive);
      if (res.success) {
        showToast(`Coupon '${c.code}' status set to ${!c.isActive ? 'Active' : 'Inactive'}.`, 'info');
        loadData();
      } else {
        showToast(res.error || 'Failed to update status.', 'error');
      }
    } catch {
      showToast('Error updating coupon state.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-amber-600" /> Discount Coupons Management
          </h1>
          <p className="text-xs text-stone-500 font-semibold">Create promotional discount codes and minimum order rules</p>
        </div>
        <Button onClick={openCreateModal} variant="primary" className="bg-slate-900 font-bold gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Create Coupon Code
        </Button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-stone-500 font-semibold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> Loading coupons from TiDB...
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Tag className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No promotional coupons configured</p>
            <p className="text-xs text-stone-500">Create your first coupon code to offer customer discounts during checkout.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min. Order Value</th>
                  <th className="py-3 px-4">Validity Until</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">{c.code}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {c.minimumOrderAmount > 0 ? `₹${c.minimumOrderAmount.toLocaleString('en-IN')}` : 'No minimum'}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(c.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.isActive ? <Badge variant="success">ACTIVE</Badge> : <Badge variant="neutral">INACTIVE</Badge>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`p-2 rounded-xl transition-colors ${
                          c.isActive
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                        }`}
                        title={c.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Create Discount Coupon</h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Coupon Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-mono font-bold uppercase"
                  placeholder="e.g. FESTIVE20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Discount Type *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed_amount')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-bold"
                    placeholder="e.g. 15"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Min. Order Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minimumOrderAmount}
                    onChange={(e) => setMinimumOrderAmount(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Validity Expiry Date</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. 15% off on orders above ₹1,000"
                />
              </div>

              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span>Active Coupon Code</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="bg-slate-900" isLoading={submitting}>
                  Create Coupon Code
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
