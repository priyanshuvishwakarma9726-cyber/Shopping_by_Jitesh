'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAdminPaymentSettings, updatePaymentSettings } from '@/services/payment-settings-service';
import { PaymentSettings } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/toast-context';
import { Shield, Upload, QrCode, AlertTriangle, Eye } from 'lucide-react';

export default function AdminPaymentSettingsPage() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Form State
  const [upiId, setUpiId] = useState('');
  const [displayName, setDisplayName] = useState('Shopping by Jitesh');
  const [instructions, setInstructions] = useState(
    '1. Scan the QR code using any UPI app.\n2. Pay the exact order amount.\n3. Enter the UTR / reference ID below and upload payment screenshot.'
  );
  const [isActive, setIsActive] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // File Compression Status
  const [compressionInfo, setCompressionInfo] = useState<{ rawSize: string; compressedSize: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        setLoading(false);
        setUnauthorized(true);
        return;
      }

      setAdminUserId(session.user.id);

      try {
        const settings: PaymentSettings | null = await getAdminPaymentSettings(session.user.id);
        if (settings) {
          setUpiId(settings.upiId || '');
          setDisplayName(settings.paymentDisplayName || 'Shopping by Jitesh');
          setInstructions(settings.paymentInstructions || '');
          setIsActive(settings.isActive);
          setQrCodeUrl(settings.qrCodeUrl || '');
          setLastUpdated(settings.updatedAt || settings.createdAt || null);
        }
      } catch {
        setUnauthorized(true);
      }

      setLoading(false);
    }

    loadSettings();
  }, [supabase.auth]);

  // Client-Side Canvas Image Compression Helper (Max 600x600, 85% WebP/JPEG)
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file format. Please select JPEG, PNG, or WEBP.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds 5MB limit.', 'error');
      return;
    }

    const rawSizeKb = (file.size / 1024).toFixed(1);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed WebP/JPEG data URL at 85% quality
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);
          const compressedSizeKb = (compressedDataUrl.length / 1024).toFixed(1);

          setQrCodeUrl(compressedDataUrl);
          setCompressionInfo({
            rawSize: `${rawSizeKb} KB`,
            compressedSize: `${compressedSizeKb} KB`,
          });

          showToast(`QR Code image compressed & ready (${compressedSizeKb} KB)`, 'success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUserId) return;

    if (!upiId.trim()) {
      showToast('Please enter a valid UPI ID.', 'error');
      return;
    }

    setSaving(true);
    const res = await updatePaymentSettings(adminUserId, {
      upiId: upiId.trim(),
      paymentDisplayName: displayName.trim(),
      paymentInstructions: instructions.trim(),
      qrCodeUrl: qrCodeUrl || undefined,
      isActive,
    });

    if (res.success) {
      showToast('Store payment settings saved successfully!', 'success');
      setLastUpdated(new Date().toISOString());
    } else {
      showToast(res.error || 'Failed to save payment settings.', 'error');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-semibold">Loading Store Payment Settings...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
        <h1 className="text-xl font-bold text-rose-900">Access Denied</h1>
        <p className="text-xs text-rose-700">
          You must be logged in as an authorized administrator to view or modify store payment settings.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-600" /> Store Payment Configuration
          </h1>
          <p className="text-xs text-stone-500">
            Configure active UPI ID, scannable QR code image, and customer payment instructions
          </p>
        </div>
        {lastUpdated && (
          <div className="text-[11px] text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded-xl">
            Last Updated:{' '}
            <span className="font-bold text-slate-800">
              {new Date(lastUpdated).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Configuration Area */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">UPI & Merchant Details</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-stone-600">Payment Status:</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  {isActive ? 'ENABLED (ACTIVE)' : 'DISABLED'}
                </button>
              </div>
            </div>

            <Input
              label="Store UPI ID *"
              placeholder="e.g. merchant@upi / 9876543210@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
              helperText="Enter the official store VPA / UPI ID where customers transfer payments."
            />

            <Input
              label="Payment Display Name *"
              placeholder="e.g. Shopping by Jitesh"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              helperText="Display name shown to customers on checkout."
            />

            {/* QR Code Upload Section */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                Store QR Code Image
              </label>
              <div className="border-2 border-dashed border-stone-300 hover:border-amber-600 transition-colors rounded-2xl p-6 text-center space-y-3 bg-stone-50/50">
                <Upload className="w-8 h-8 text-stone-400 mx-auto" />
                <div>
                  <label className="cursor-pointer text-xs font-bold text-amber-600 hover:underline">
                    Upload New QR Code Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-stone-500 mt-1">
                    JPEG, PNG, WEBP (Max 5MB raw file). Auto-compressed to max 600x600 resolution.
                  </p>
                </div>
                {compressionInfo && (
                  <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl inline-block border border-emerald-200">
                    Compressed: {compressionInfo.rawSize} ➔ {compressionInfo.compressedSize}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                Payment Instructions for Customers
              </label>
              <textarea
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter step-by-step instructions for paying via QR code..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 justify-center text-xs uppercase tracking-wider"
            >
              {saving ? 'Saving Changes...' : 'Save Payment Configuration'}
            </Button>
          </div>
        </form>

        {/* Live Customer Checkout Preview Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-amber-600" /> Customer Checkout Preview
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-6 shadow-lg border border-slate-800">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                PAY USING UPI
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                  isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isActive ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">{displayName || 'Shopping by Jitesh'}</h3>
              <p className="text-xs font-mono text-amber-400 font-bold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 truncate">
                {upiId || 'No UPI ID Configured'}
              </p>
            </div>

            {/* QR Code Presentation Box */}
            <div className="bg-white p-4 rounded-2xl text-center space-y-2 border border-stone-200">
              {qrCodeUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrCodeUrl}
                  alt="Store Payment QR Code"
                  className="w-44 h-44 mx-auto object-contain rounded-lg"
                />
              ) : (
                <div className="w-44 h-44 mx-auto bg-stone-100 rounded-lg flex flex-col items-center justify-center p-4 text-stone-400 space-y-2">
                  <QrCode className="w-10 h-10" />
                  <span className="text-[10px] font-bold text-center">No QR Image Uploaded</span>
                </div>
              )}
              <p className="text-[10px] text-stone-600 font-semibold pt-1">
                Scan this QR code using your UPI app to pay.
              </p>
            </div>

            {/* Configured Instructions Preview */}
            <div className="text-[11px] text-stone-300 space-y-1 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Instructions:
              </span>
              <p className="whitespace-pre-line leading-relaxed">{instructions}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
