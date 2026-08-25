'use server';

import { query } from '@/lib/db';
import { cryptoNativeUUID } from '@/lib/utils';
import { verifyAdminRole } from '@/services/admin-service';
import { Coupon } from '@/types';

export async function getAdminCoupons(adminUserId: string): Promise<Coupon[]> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized administrative access attempt.');
  }

  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM coupons ORDER BY created_at DESC`
    );

    if (!rows || rows.length === 0) return [];

    return rows.map((r) => ({
      id: String(r.id),
      code: String(r.code),
      description: String(r.description || ''),
      discountType: (r.discount_type as Coupon['discountType']) || 'percentage',
      discountValue: Number(r.discount_value),
      minimumOrderAmount: Number(r.minimum_order_amount || 0),
      maxDiscountAmount: r.max_discount_amount ? Number(r.max_discount_amount) : undefined,
      validUntil: String(r.valid_until || new Date().toISOString()),
      isActive: Boolean(r.is_active),
    }));
  } catch (err) {
    console.warn('[Coupon Service Warning] Failed to fetch coupons:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minimumOrderAmount?: number;
  maxDiscountAmount?: number;
  validUntil?: string;
  isActive?: boolean;
}

export async function createCoupon(
  adminUserId: string,
  input: CreateCouponInput
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  if (!input.code || input.code.trim().length === 0) {
    return { success: false, error: 'Coupon code is required.' };
  }

  if (input.discountValue <= 0 || isNaN(input.discountValue)) {
    return { success: false, error: 'Discount value must be greater than zero.' };
  }

  const cleanCode = input.code.trim().toUpperCase();

  try {
    const existing = await query<Record<string, unknown>>(
      `SELECT id FROM coupons WHERE UPPER(code) = ? LIMIT 1`,
      [cleanCode]
    );

    if (existing && existing.length > 0) {
      return { success: false, error: `Coupon code '${cleanCode}' already exists.` };
    }

    const couponId = cryptoNativeUUID();
    await query(
      `INSERT INTO coupons (id, code, description, discount_type, discount_value, minimum_order_amount, max_discount_amount, valid_until, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        couponId,
        cleanCode,
        input.description ? input.description.trim() : null,
        input.discountType,
        input.discountValue,
        input.minimumOrderAmount || 0,
        input.maxDiscountAmount || null,
        input.validUntil || null,
        input.isActive ?? true,
      ]
    );

    return { success: true };
  } catch (err) {
    console.warn('[Coupon Service Warning] Failed to create coupon:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to create discount coupon.' };
  }
}

export async function toggleCouponActive(
  adminUserId: string,
  couponId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  try {
    await query(
      `UPDATE coupons SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [isActive, couponId]
    );

    return { success: true };
  } catch (err) {
    console.warn('[Coupon Service Warning] Failed to toggle coupon state:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to update coupon status.' };
  }
}
