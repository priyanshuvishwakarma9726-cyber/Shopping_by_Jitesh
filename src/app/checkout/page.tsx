'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';
import { createClient } from '@/lib/supabase/client';
import { Address, PaymentSettings } from '@/types';
import { getUserAddresses, createAddress } from '@/services/address-service';
import { createOrder } from '@/services/order-service';
import { getPublicPaymentSettings } from '@/services/payment-settings-service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Lock,
  MapPin,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Upload,
  AlertCircle,
  Copy,
  Check,
  Maximize2,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { showToast } = useToast();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    addressType: 'home' as 'home' | 'work' | 'other',
    isDefault: false,
  });

  // Payment Configuration & Reference State
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isZoomQrOpen, setIsZoomQrOpen] = useState(false);

  const [transactionRef, setTransactionRef] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');

  // 1. Authenticate user, load addresses & public payment settings
  useEffect(() => {
    async function loadCheckoutData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        router.push('/login?next=/checkout');
        return;
      }

      setUserId(session.user.id);

      // Fetch user's stored delivery addresses
      const userAddrs = await getUserAddresses(session.user.id);
      setAddresses(userAddrs);

      const defaultAddr = userAddrs.find((a) => a.isDefault) || userAddrs[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }

      // Fetch store's active payment configuration
      const activeSettings = await getPublicPaymentSettings();
      setPaymentSettings(activeSettings);

      setLoading(false);
    }

    loadCheckoutData();
  }, [router, supabase.auth]);

  // Copy UPI ID to Clipboard Handler
  const handleCopyUpi = async () => {
    if (!paymentSettings?.upiId) return;
    try {
      await navigator.clipboard.writeText(paymentSettings.upiId);
      setCopiedUpi(true);
      showToast('UPI ID copied to clipboard', 'success');
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      showToast('Failed to copy UPI ID. Please copy manually.', 'error');
    }
  };

  // Handle adding new address during checkout
  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const created = await createAddress(userId, newAddress);
    if (created) {
      const updated = await getUserAddresses(userId);
      setAddresses(updated);
      setSelectedAddressId(created.id);
      setIsAddAddressOpen(false);
      showToast('Delivery address added');
    } else {
      showToast('Failed to add address', 'error');
    }
  };

  // Handle Proof File Upload & Base64 conversion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setProofFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Final Order Submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!paymentSettings || !paymentSettings.isActive || !paymentSettings.upiId) {
      showToast('Online payment is temporarily unavailable. Please try again later.', 'error');
      return;
    }

    if (!selectedAddressId) {
      showToast('Please select a delivery address to continue.', 'error');
      return;
    }

    if (!transactionRef.trim()) {
      showToast('Please enter your payment Transaction / Reference ID.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const orderItems = cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
      }));

      const res = await createOrder(
        userId,
        selectedAddressId,
        orderItems,
        transactionRef.trim(),
        proofPreview || undefined
      );

      if (res.success && res.orderId) {
        clearCart();
        showToast('Order placed successfully! Payment under verification.', 'success');
        router.push(`/account/orders/${res.orderId}`);
      } else {
        showToast(res.error || 'Failed to place order. Please try again.', 'error');
        setSubmitting(false);
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-700">Loading Checkout Portal...</p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-black text-slate-900">Your Shopping Bag is empty</h1>
        <p className="text-sm text-stone-500">Please add items to your cart before proceeding to checkout.</p>
        <Link href="/products">
          <Button variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
            Browse Store Catalog
          </Button>
        </Link>
      </div>
    );
  }

  const isPaymentAvailable = Boolean(paymentSettings && paymentSettings.isActive && paymentSettings.upiId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Checkout Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Express Checkout</h1>
          <p className="text-xs text-stone-500">Shopping by Jitesh Secure Order Processing</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-stone-100 px-3.5 py-2 rounded-xl">
          <Lock className="w-4 h-4 text-emerald-600" /> Server-Side Verified Pricing & Security
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: Delivery Address Selection */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" /> 1. Select Delivery Address
              </h2>
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(true)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">Add a delivery address to continue.</p>
                <Button
                  onClick={() => setIsAddAddressOpen(true)}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  Add Delivery Address
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-600/20'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {addr.fullName}
                      </span>
                      {selectedAddressId === addr.id && (
                        <CheckCircle2 className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-2 font-medium">
                      {addr.streetAddress}
                      {addr.apartment ? `, ${addr.apartment}` : ''}
                    </p>
                    <p className="text-xs text-stone-600 font-medium">
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p className="text-xs text-slate-700 font-bold mt-2">{addr.phoneNumber}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: Real Configurable Payment Section */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-stone-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" /> 2. Manual Payment & Proof Submission
            </h2>

            {!isPaymentAvailable ? (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Online payment is temporarily unavailable</h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  Please try again later or contact customer support. Order placement will resume once store payment configuration is enabled.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Store Payment Info Card */}
                <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl space-y-6 shadow-md border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                        PAY USING UPI
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {paymentSettings?.paymentDisplayName || 'Shopping by Jitesh'}
                      </h3>
                    </div>

                    {/* Exact Server-Calculated Order Total Display */}
                    <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 text-right">
                      <span className="text-[10px] text-stone-400 block uppercase tracking-wider font-semibold">
                        Amount to Pay
                      </span>
                      <span className="text-lg font-black text-amber-400">
                        ₹{cart.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* UPI ID & Copy Button */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-stone-400 block">Store UPI ID:</span>
                    <div className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-2xl border border-slate-700">
                      <span className="font-mono text-sm font-bold text-amber-400 flex-1 truncate pl-1">
                        {paymentSettings?.upiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy UPI ID
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Premium Scannable QR Code Card */}
                  {paymentSettings?.qrCodeUrl && (
                    <div className="space-y-2">
                      <div className="bg-white p-5 rounded-2xl text-center space-y-2 max-w-xs mx-auto border border-stone-200 relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={paymentSettings.qrCodeUrl}
                          alt="Store Payment QR Code"
                          className="w-48 h-48 mx-auto object-contain rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setIsZoomQrOpen(true)}
                          className="absolute top-3 right-3 p-1.5 bg-slate-900/80 text-white rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                          title="Zoom QR Code"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-center text-xs text-stone-300 font-medium">
                        Scan this QR code using your UPI app to pay.
                      </p>
                    </div>
                  )}

                  {/* Custom Admin Instructions */}
                  {paymentSettings?.paymentInstructions && (
                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 text-xs text-stone-300 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                        Instructions:
                      </span>
                      <p className="whitespace-pre-line leading-relaxed">
                        {paymentSettings.paymentInstructions}
                      </p>
                    </div>
                  )}

                  {/* Customer Safety Disclaimer */}
                  <p className="text-[11px] text-stone-400 text-center italic border-t border-slate-800 pt-3">
                    Shopping by Jitesh will manually verify your payment before confirming the order.
                  </p>
                </div>

                {/* Transaction Reference & Screenshot Submission */}
                <div className="space-y-4 pt-2">
                  <p className="text-xs font-semibold text-slate-800">
                    After completing payment, enter your transaction/reference ID below and upload your payment screenshot.
                  </p>

                  <Input
                    label="Transaction / UTR Reference ID *"
                    placeholder="e.g. UTR1029384756 / 42910482019"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    required
                    helperText="Enter the 12-digit transaction ID or UTR reference from your payment confirmation screen."
                  />

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Upload Payment Screenshot / Proof (Optional but Recommended)
                    </label>
                    <div className="border-2 border-dashed border-stone-300 hover:border-amber-600 transition-colors rounded-2xl p-6 text-center space-y-3 bg-stone-50/50">
                      <Upload className="w-8 h-8 text-stone-400 mx-auto" />
                      <div>
                        <label className="cursor-pointer text-xs font-bold text-amber-600 hover:underline">
                          Click to choose screenshot
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Supported files: JPEG, PNG, WEBP (Max 5MB)
                        </p>
                      </div>
                      {proofFile && (
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg inline-block">
                          Selected: {proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Server Price Calculation & Order Review */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 h-fit">
          <h2 className="text-lg font-bold text-slate-900 border-b border-stone-100 pb-4">
            Order Summary ({cart.itemCount} items)
          </h2>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-3 text-xs border-b border-stone-100 pb-3">
                <div className="w-12 h-12 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                  {item.product.images?.[0]?.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.product.images[0].imageUrl}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{item.product.title}</h4>
                  {item.selectedVariant && (
                    <p className="text-stone-500 text-[11px]">{item.selectedVariant.title}</p>
                  )}
                  <p className="text-stone-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right font-bold text-slate-900">
                  ₹{item.totalPrice.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-sm text-stone-600 border-t border-stone-200 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">
                ₹{cart.subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Shipping Fee</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Tax</span>
              <span>₹0.00</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 border-t border-stone-200 pt-3">
              <span>Order Total</span>
              <span className="text-amber-600">₹{cart.subtotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="text-[11px] text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <p className="font-semibold text-slate-800 mb-0.5">Notice:</p>
            Final pricing and inventory stock are verified server-side upon submitting your order.
          </div>

          <Button
            onClick={handlePlaceOrder}
            disabled={submitting || addresses.length === 0 || !isPaymentAvailable}
            size="lg"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 justify-center"
          >
            {submitting
              ? 'Creating Order...'
              : !isPaymentAvailable
              ? 'Online Payment Unavailable'
              : 'Submit Order & Payment Proof'}
          </Button>
        </div>
      </div>

      {/* Modal to Add Delivery Address */}
      <Modal
        isOpen={isAddAddressOpen}
        onClose={() => setIsAddAddressOpen(false)}
        title="Add Delivery Address"
      >
        <form onSubmit={handleCreateAddress} className="space-y-4">
          <Input
            label="Full Name *"
            required
            value={newAddress.fullName}
            onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
          />
          <Input
            label="Phone Number *"
            required
            value={newAddress.phoneNumber}
            onChange={(e) => setNewAddress({ ...newAddress, phoneNumber: e.target.value })}
          />
          <Input
            label="Street Address *"
            required
            value={newAddress.streetAddress}
            onChange={(e) => setNewAddress({ ...newAddress, streetAddress: e.target.value })}
          />
          <Input
            label="Apartment / Suite (Optional)"
            value={newAddress.apartment}
            onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City *"
              required
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
            />
            <Input
              label="State *"
              required
              value={newAddress.state}
              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
            />
          </div>
          <Input
            label="Postal / PIN Code *"
            required
            value={newAddress.postalCode}
            onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddAddressOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Save & Use Address
            </Button>
          </div>
        </form>
      </Modal>

      {/* Zoom QR Code Modal */}
      {paymentSettings?.qrCodeUrl && (
        <Modal
          isOpen={isZoomQrOpen}
          onClose={() => setIsZoomQrOpen(false)}
          title="Store Payment QR Code"
        >
          <div className="text-center space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={paymentSettings.qrCodeUrl}
              alt="Store Payment QR Code Zoomed"
              className="max-h-96 mx-auto object-contain rounded-2xl border border-stone-200"
            />
            <p className="text-xs text-stone-500 font-medium">
              Scan with your UPI App (Google Pay, PhonePe, Paytm, BHIM)
            </p>
            <Button onClick={() => setIsZoomQrOpen(false)} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
