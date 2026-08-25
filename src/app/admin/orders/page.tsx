'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAdminOrders, approvePayment, rejectPayment, AdminOrderView } from '@/services/admin-service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/toast-context';
import { Eye } from 'lucide-react';

export default function AdminOrdersPage() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'payment_pending' | 'confirmed' | 'payment_rejected'>('all');

  // Modal States
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<AdminOrderView | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function initAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        setLoading(false);
        return;
      }

      setAdminUserId(session.user.id);
      try {
        const fetched = await getAdminOrders(session.user.id, filter);
        setOrders(fetched);
      } catch {
        showToast('Unauthorized admin access.', 'error');
      }
      setLoading(false);
    }

    initAdmin();
  }, [filter, showToast, supabase.auth]);

  const handleApprove = async (view: AdminOrderView) => {
    if (!adminUserId) return;
    setProcessing(true);

    const res = await approvePayment(adminUserId, view.payment.id, view.order.id);
    if (res.success) {
      showToast(`Order ${view.order.orderNumber} payment APPROVED!`, 'success');
      const updated = await getAdminOrders(adminUserId, filter);
      setOrders(updated);
    } else {
      showToast(res.error || 'Failed to approve payment.', 'error');
    }
    setProcessing(false);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUserId || !rejectingOrder) return;

    if (!rejectionReason.trim()) {
      showToast('Please enter a valid rejection reason.', 'error');
      return;
    }

    setProcessing(true);
    const res = await rejectPayment(
      adminUserId,
      rejectingOrder.payment.id,
      rejectingOrder.order.id,
      rejectionReason.trim()
    );

    if (res.success) {
      showToast(`Order ${rejectingOrder.order.orderNumber} payment REJECTED.`, 'info');
      setRejectingOrder(null);
      setRejectionReason('');
      const updated = await getAdminOrders(adminUserId, filter);
      setOrders(updated);
    } else {
      showToast(res.error || 'Failed to reject payment.', 'error');
    }
    setProcessing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">CONFIRMED</Badge>;
      case 'payment_pending':
        return <Badge variant="warning">PENDING VERIFICATION</Badge>;
      case 'payment_rejected':
        return <Badge variant="danger">REJECTED</Badge>;
      default:
        return <Badge variant="neutral">{status.toUpperCase()}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-semibold">Loading Administrative Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Order & Payment Verification Portal</h1>
          <p className="text-xs text-stone-500">Review customer manual payment proofs, approve valid orders, or issue rejections</p>
        </div>

        {/* Filters */}
        <div className="flex bg-white border border-stone-200 rounded-xl p-1 text-xs font-bold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all' ? 'bg-slate-900 text-white' : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter('payment_pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'payment_pending' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'confirmed' ? 'bg-emerald-600 text-white' : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('payment_rejected')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'payment_rejected' ? 'bg-rose-600 text-white' : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Orders List Table */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-sm text-stone-500">
          No orders match the selected status filter.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-stone-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Order Number</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Reference ID</th>
                  <th className="py-3.5 px-4">Proof</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((view) => (
                  <tr key={view.order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-4 font-black text-slate-900">
                      {view.order.orderNumber}
                      <span className="block text-[10px] text-stone-400 font-normal">
                        {new Date(view.order.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {view.customerName}
                      <span className="block text-[10px] text-stone-500 font-normal">
                        {view.customerEmail}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-black text-amber-600">
                      ₹{view.order.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-700">
                      {view.payment.transactionReference}
                    </td>
                    <td className="py-4 px-4">
                      {view.payment.proofUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedProofUrl(view.payment.proofUrl || null)}
                          className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Proof
                        </button>
                      ) : (
                        <span className="text-stone-400 text-[10px]">No file</span>
                      )}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(view.order.status)}</td>
                    <td className="py-4 px-4 text-right">
                      {view.order.status === 'payment_pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleApprove(view)}
                            disabled={processing}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1 px-3"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => setRejectingOrder(view)}
                            disabled={processing}
                            size="sm"
                            variant="outline"
                            className="border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs py-1 px-3"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-stone-400 font-medium">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      <Modal
        isOpen={Boolean(selectedProofUrl)}
        onClose={() => setSelectedProofUrl(null)}
        title="Customer Payment Screenshot Proof"
      >
        <div className="space-y-4 text-center">
          {selectedProofUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={selectedProofUrl}
              alt="Payment Proof"
              className="max-h-96 mx-auto rounded-2xl border border-stone-200 object-contain"
            />
          )}
          <Button onClick={() => setSelectedProofUrl(null)} variant="outline" size="sm">
            Close Preview
          </Button>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={Boolean(rejectingOrder)}
        onClose={() => setRejectingOrder(null)}
        title={`Reject Payment for Order ${rejectingOrder?.order.orderNumber}`}
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <p className="text-xs text-stone-600">
            Please enter a clear explanation for rejecting this payment. The customer will be able to read this reason and resubmit their transaction details.
          </p>
          <Input
            label="Rejection Reason *"
            placeholder="e.g. Transaction ID invalid / Amount mismatch"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectingOrder(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={processing}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
