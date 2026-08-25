'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, MapPin, Edit2, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Address } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/context/toast-context';
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  AddressInput,
} from '@/services/address-service';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [addressType, setAddressType] = useState<'home' | 'work' | 'other'>('home');
  const [isDefault, setIsDefault] = useState(false);

  const supabase = createClient();
  const { showToast } = useToast();

  const loadAddresses = async (uid: string) => {
    setLoading(true);
    const data = await getUserAddresses(uid);
    setAddresses(data);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        loadAddresses(data.user.id);
      } else {
        setLoading(false);
      }
    });
  }, [supabase]);

  const openAddModal = () => {
    setEditingAddress(null);
    setFullName('');
    setPhoneNumber('');
    setStreetAddress('');
    setApartment('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('India');
    setAddressType('home');
    setIsDefault(addresses.length === 0);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFullName(addr.fullName);
    setPhoneNumber(addr.phoneNumber);
    setStreetAddress(addr.streetAddress);
    setApartment(addr.apartment || '');
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setCountry(addr.country || 'India');
    setAddressType(addr.addressType || 'home');
    setIsDefault(addr.isDefault);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !phoneNumber || !streetAddress || !city || !state || !postalCode) {
      showToast('Please fill in all required address fields.', 'error');
      return;
    }

    setSubmitting(true);

    const payload: AddressInput = {
      fullName,
      phoneNumber,
      streetAddress,
      apartment: apartment || undefined,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefault,
    };

    if (editingAddress) {
      const ok = await updateAddress(userId, editingAddress.id, payload);
      if (ok) {
        showToast('Address updated successfully!', 'success');
        setIsModalOpen(false);
        loadAddresses(userId);
      } else {
        showToast('Failed to update address.', 'error');
      }
    } else {
      const newAddr = await createAddress(userId, payload);
      if (newAddr) {
        showToast('New address saved!', 'success');
        setIsModalOpen(false);
        loadAddresses(userId);
      } else {
        showToast('Failed to save address.', 'error');
      }
    }

    setSubmitting(false);
  };

  const handleSetDefault = async (addrId: string) => {
    const ok = await setDefaultAddress(userId, addrId);
    if (ok) {
      showToast('Default address updated!', 'success');
      loadAddresses(userId);
    } else {
      showToast('Failed to set default address.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAddressId) return;
    const ok = await deleteAddress(userId, deletingAddressId);
    if (ok) {
      showToast('Address removed.', 'success');
      setDeletingAddressId(null);
      loadAddresses(userId);
    } else {
      showToast('Failed to remove address.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-amber-600">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Saved Addresses</h1>
          <p className="text-sm text-stone-500">Manage shipping addresses for fast express delivery</p>
        </div>
        <Button
          onClick={openAddModal}
          variant="primary"
          className="bg-amber-600 hover:bg-amber-700 font-bold text-xs"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Address
        </Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center text-xs font-bold text-stone-500">
          Loading saved addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Saved Addresses</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Add your home or work delivery address for quick checkout.
            </p>
          </div>
          <Button onClick={openAddModal} variant="primary" className="bg-slate-900 hover:bg-slate-800 text-xs font-bold">
            Add Delivery Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-3xl p-6 space-y-4 relative border transition-all ${
                addr.isDefault ? 'border-2 border-amber-500/80 shadow-xs' : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{addr.fullName}</h3>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                      {addr.addressType}
                    </span>
                  </div>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase mt-1">
                      <Star className="w-3 h-3 fill-amber-600 text-amber-600" /> Default Shipping Address
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {addr.streetAddress} {addr.apartment ? `, ${addr.apartment}` : ''}<br />
                {addr.city}, {addr.state} - {addr.postalCode}<br />
                {addr.country}<br />
                <span className="font-semibold text-slate-900">Phone: {addr.phoneNumber}</span>
              </p>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="font-bold text-amber-600 hover:text-amber-700"
                  >
                    Set as Default
                  </button>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={() => openEditModal(addr)}
                    className="flex items-center gap-1 font-bold text-stone-600 hover:text-slate-900"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeletingAddressId(addr.id)}
                    className="flex items-center gap-1 font-bold text-stone-500 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Street Address</label>
            <input
              type="text"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Apartment / Suite (Optional)</label>
              <input
                type="text"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Address Label</label>
              <select
                value={addressType}
                onChange={(e) => setAddressType(e.target.value as 'home' | 'work' | 'other')}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-slate-900"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700">
              Set as default shipping address
            </label>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs font-bold">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              isLoading={submitting}
            >
              {editingAddress ? 'Save Changes' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingAddressId)}
        onClose={() => setDeletingAddressId(null)}
        title="Confirm Address Deletion"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-stone-600">
            Are you sure you want to delete this shipping address? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
            <Button variant="outline" onClick={() => setDeletingAddressId(null)} className="text-xs font-bold">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} variant="danger" className="text-xs font-bold">
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
