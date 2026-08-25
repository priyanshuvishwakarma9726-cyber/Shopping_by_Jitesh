'use server';

import { Address } from '@/types';
import { query } from '@/lib/db';
import { cryptoNativeUUID } from '@/lib/utils';

export interface AddressInput {
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  addressType?: 'home' | 'work' | 'other';
  isDefault?: boolean;
}

export async function getUserAddresses(userId: string): Promise<Address[]> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    if (rows) {
      return rows.map((a) => ({
        id: String(a.id),
        userId: String(a.user_id),
        fullName: String(a.full_name),
        phoneNumber: String(a.phone_number),
        streetAddress: String(a.street_address),
        apartment: a.apartment ? String(a.apartment) : undefined,
        city: String(a.city),
        state: String(a.state),
        postalCode: String(a.postal_code),
        country: String(a.country || 'India'),
        addressType: (a.address_type as 'home' | 'work' | 'other') || 'home',
        isDefault: Boolean(a.is_default),
      }));
    }
  } catch (err) {
    console.warn('[Address Service Warning] Failed to fetch user addresses:', err instanceof Error ? err.message : String(err));
  }
  return [];
}

export async function createAddress(userId: string, data: AddressInput): Promise<Address | null> {
  const addressId = cryptoNativeUUID();

  try {
    if (data.isDefault) {
      await query(`UPDATE addresses SET is_default = FALSE WHERE user_id = ?`, [userId]);
    }

    await query(
      `INSERT INTO addresses (id, user_id, full_name, phone_number, street_address, apartment, city, state, postal_code, country, address_type, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        addressId,
        userId,
        data.fullName,
        data.phoneNumber,
        data.streetAddress,
        data.apartment || null,
        data.city,
        data.state,
        data.postalCode,
        data.country || 'India',
        data.addressType || 'home',
        Boolean(data.isDefault),
      ]
    );

    return {
      id: addressId,
      userId,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      streetAddress: data.streetAddress,
      apartment: data.apartment,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country || 'India',
      addressType: data.addressType || 'home',
      isDefault: Boolean(data.isDefault),
    };
  } catch (err) {
    console.warn('[Address Service Warning] Failed to create address:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function updateAddress(
  userId: string,
  addressId: string,
  data: AddressInput
): Promise<boolean> {
  try {
    if (data.isDefault) {
      await query(`UPDATE addresses SET is_default = FALSE WHERE user_id = ?`, [userId]);
    }

    const result = await query(
      `UPDATE addresses
       SET full_name = ?, phone_number = ?, street_address = ?, apartment = ?, city = ?, state = ?, postal_code = ?, country = ?, address_type = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        data.fullName,
        data.phoneNumber,
        data.streetAddress,
        data.apartment || null,
        data.city,
        data.state,
        data.postalCode,
        data.country || 'India',
        data.addressType || 'home',
        Boolean(data.isDefault),
        addressId,
        userId,
      ]
    );

    return result !== null;
  } catch (err) {
    console.warn('[Address Service Warning] Failed to update address:', err instanceof Error ? err.message : String(err));
    return false;
  }
}

export async function deleteAddress(userId: string, addressId: string): Promise<boolean> {
  try {
    await query(`DELETE FROM addresses WHERE id = ? AND user_id = ?`, [addressId, userId]);
    return true;
  } catch (err) {
    console.warn('[Address Service Warning] Failed to delete address:', err instanceof Error ? err.message : String(err));
    return false;
  }
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<boolean> {
  try {
    await query(`UPDATE addresses SET is_default = FALSE WHERE user_id = ?`, [userId]);
    await query(`UPDATE addresses SET is_default = TRUE WHERE id = ? AND user_id = ?`, [addressId, userId]);
    return true;
  } catch (err) {
    console.warn('[Address Service Warning] Failed to set default address:', err instanceof Error ? err.message : String(err));
    return false;
  }
}
