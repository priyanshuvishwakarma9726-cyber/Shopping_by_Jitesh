'use server';

import { query } from '@/lib/db';
import { cryptoNativeUUID } from '@/lib/utils';
import { PaymentSettings } from '@/types';
import { verifyAdminRole } from '@/services/admin-service';

/**
 * Fetch Public Active Payment Settings for Customer Checkout
 * Returns null if no payment configuration exists or if payment method is disabled.
 */
export async function getPublicPaymentSettings(): Promise<PaymentSettings | null> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM payment_settings WHERE is_active = TRUE ORDER BY updated_at DESC LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const r = rows[0];
    if (!r.upi_id || !r.is_active) {
      return null;
    }

    return {
      id: String(r.id),
      upiId: String(r.upi_id),
      qrCodeUrl: r.qr_code_url ? String(r.qr_code_url) : undefined,
      paymentDisplayName: String(r.payment_display_name || 'Shopping by Jitesh'),
      paymentInstructions: r.payment_instructions ? String(r.payment_instructions) : undefined,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at ? String(r.created_at) : undefined,
      updatedAt: r.updated_at ? String(r.updated_at) : undefined,
    };
  } catch (err) {
    console.warn('[Payment Settings Warning] Failed to fetch public payment settings:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Fetch Payment Settings for Admin Portal (Server-Side Admin Role Verification)
 */
export async function getAdminPaymentSettings(adminUserId: string): Promise<PaymentSettings | null> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized administrative access attempt.');
  }

  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM payment_settings ORDER BY updated_at DESC LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const r = rows[0];
    return {
      id: String(r.id),
      upiId: String(r.upi_id),
      qrCodeUrl: r.qr_code_url ? String(r.qr_code_url) : undefined,
      paymentDisplayName: String(r.payment_display_name || 'Shopping by Jitesh'),
      paymentInstructions: r.payment_instructions ? String(r.payment_instructions) : undefined,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at ? String(r.created_at) : undefined,
      updatedAt: r.updated_at ? String(r.updated_at) : undefined,
    };
  } catch (err) {
    console.warn('[Payment Settings Warning] Failed to fetch admin payment settings:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export interface UpdatePaymentSettingsInput {
  upiId: string;
  qrCodeUrl?: string;
  paymentDisplayName?: string;
  paymentInstructions?: string;
  isActive: boolean;
}

/**
 * Update/Insert Store Payment Settings (Server-Side Admin Verification)
 */
export async function updatePaymentSettings(
  adminUserId: string,
  input: UpdatePaymentSettingsInput
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  if (!input.upiId || input.upiId.trim().length === 0) {
    return { success: false, error: 'UPI ID is required.' };
  }

  const cleanUpiId = input.upiId.trim();
  const cleanDisplayName = (input.paymentDisplayName || 'Shopping by Jitesh').trim();
  const cleanInstructions = input.paymentInstructions ? input.paymentInstructions.trim() : null;
  const qrCodeUrl = input.qrCodeUrl || null;
  const isActive = Boolean(input.isActive);

  try {
    const existing = await query<Record<string, unknown>>(
      `SELECT id FROM payment_settings LIMIT 1`
    );

    if (existing && existing.length > 0) {
      const existingId = String(existing[0].id);
      await query(
        `UPDATE payment_settings 
         SET upi_id = ?, qr_code_url = ?, payment_display_name = ?, payment_instructions = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [cleanUpiId, qrCodeUrl, cleanDisplayName, cleanInstructions, isActive, existingId]
      );
    } else {
      const newId = cryptoNativeUUID();
      await query(
        `INSERT INTO payment_settings (id, upi_id, qr_code_url, payment_display_name, payment_instructions, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId, cleanUpiId, qrCodeUrl, cleanDisplayName, cleanInstructions, isActive]
      );
    }

    return { success: true };
  } catch (err) {
    console.warn('[Payment Settings Warning] Failed to update payment settings:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to update store payment settings.' };
  }
}
