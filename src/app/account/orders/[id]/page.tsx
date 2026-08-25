'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserOrderById, resubmitPaymentProof } from '@/services/order-service';
import { Order, OrderItem, PaymentRecord } from '@/types';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/toast-context';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    order: Order;
    items: OrderItem[];
    payment?: PaymentRecord;
    address?: Record<string, unknown> | null;
  } | null>(null);

  // Resubmit Payment State
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [newTxnRef, setNewTxnRef] = useState('');
  const [newProofPreview, setNewProofPreview] = useState('');

  useEffect(() => {
    async function loadOrder() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        router.push('/login');
        return;
      }

      const res = await getUserOrderById(session.user.id, orderId);
      if (res) {
        setData(res);
      }
      setLoading(false);
    }

    loadOrder();
  }, [orderId, router, supabase.auth]);

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Please upload a valid image file (JPEG, PNG, WEBP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxnRef.trim()) {
      showToast('Please enter your updated Transaction / Reference ID.', 'error');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || !session.user) return;

    setIsResubmitting(true);
    const res = await resubmitPaymentProof(
      session.user.id,
      orderId,
      newTxnRef.trim(),
      newProofPreview || undefined
    );

    if (res.success) {
      showToast('Payment proof resubmitted successfully! Status reset to pending verification.', 'success');
      const updated = await getUserOrderById(session.user.id, orderId);
      if (updated) setData(updated);
    } else {
      showToast(res.error || 'Failed to resubmit payment proof.', 'error');
    }
    setIsResubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-stone-500 font-semibold">Loading Order Details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-black text-slate-900">Order Not Found</h1>
        <p className="text-xs text-stone-500">The requested order does not exist or access is unauthorized.</p>
        <Link href="/account/orders">
          <Button variant="primary" className="bg-slate-900">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const { order, items, payment, address } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/account/orders">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{order.orderNumber}</h1>
            {order.status === 'confirmed' && <Badge variant="success">CONFIRMED</Badge>}
            {order.status === 'payment_pending' && (
              <Badge variant="warning">PAYMENT PENDING VERIFICATION</Badge>
            )}
            {order.status === 'payment_rejected' && <Badge variant="danger">PAYMENT REJECTED</Badge>}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Rejection Notice & Resubmit Section */}
      {order.status === 'payment_rejected' && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900">Payment Verification Failed</h3>
              <p className="text-xs text-rose-700">
                Reason from Administrator:{' '}
                <span className="font-bold">{payment?.rejectionReason || 'Transaction could not be verified.'}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleResubmit} className="bg-white p-5 rounded-2xl border border-rose-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Resubmit Payment Reference Details
            </h4>
            <Input
              label="Updated Transaction / Reference ID *"
              placeholder="Enter correct UTR reference ID"
              value={newTxnRef}
              onChange={(e) => setNewTxnRef(e.target.value)}
              required
            />
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Upload New Payment Screenshot (Optional)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProofUpload}
                className="text-xs block text-stone-500"
              />
            </div>
            <Button
              type="submit"
              disabled={isResubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              {isResubmitting ? 'Submitting...' : 'Submit Payment Proof Again'}
            </Button>
          </form>
        </div>
      )}

      {/* Status Timeline */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-stone-100 pb-3">
          Order Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-stone-500 block">Payment Status</span>
            <span className="font-bold text-slate-900 uppercase">{payment?.status || 'PENDING'}</span>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-stone-500 block">Transaction Reference</span>
            <span className="font-bold text-slate-900 truncate block">
              {payment?.transactionReference || 'N/A'}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-stone-500 block">Fulfilment Status</span>
            <span className="font-bold text-slate-900 uppercase">{order.status}</span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-stone-100 pb-3">
          Purchased Items ({items.length})
        </h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-xs border-b border-stone-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900">{item.productTitle}</h4>
                {item.variantTitle && <p className="text-stone-500">{item.variantTitle}</p>}
                <p className="text-stone-500">
                  Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                </p>
              </div>
              <span className="font-bold text-slate-900">
                ₹{item.totalPrice.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address & Pricing Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-stone-100 pb-2">
            Delivery Address
          </h3>
          {address ? (
            <div className="text-xs text-stone-600 space-y-1">
              <p className="font-bold text-slate-900">{String(address.full_name || '')}</p>
              <p>{String(address.street_address || '')}{address.apartment ? `, ${String(address.apartment)}` : ''}</p>
              <p>{String(address.city || '')}, {String(address.state || '')} - {String(address.postal_code || '')}</p>
              <p className="font-bold text-slate-900 pt-1">{String(address.phone_number || '')}</p>
            </div>
          ) : (
            <p className="text-xs text-stone-500">Address record attached.</p>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-stone-100 pb-2">
            Payment Summary
          </h3>
          <div className="space-y-2 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Shipping Fee</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>₹0.00</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-stone-200 pt-2">
              <span>Total Paid / Payable</span>
              <span className="text-amber-600">₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
