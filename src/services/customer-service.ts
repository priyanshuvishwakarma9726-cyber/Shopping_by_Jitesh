'use server';

import { query } from '@/lib/db';
import { verifyAdminRole } from '@/services/admin-service';
import { User, Order, Address } from '@/types';

export interface AdminCustomerView {
  customer: User;
  orderCount: number;
  totalSpent: number;
}

export async function getAdminCustomers(
  adminUserId: string,
  search?: string
): Promise<AdminCustomerView[]> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized administrative access attempt.');
  }

  try {
    let sql = `
      SELECT u.*, 
             (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
             (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND status IN ('confirmed', 'processing', 'shipped', 'delivered') AND payment_status = 'approved') as total_spent
      FROM users u
      WHERE u.role = 'customer'
      ORDER BY u.created_at DESC
    `;

    const params: string[] = [];

    if (search && search.trim().length > 0) {
      const q = `%${search.trim()}%`;
      sql = `
        SELECT u.*, 
               (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
               (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND status IN ('confirmed', 'processing', 'shipped', 'delivered') AND payment_status = 'approved') as total_spent
        FROM users u
        WHERE u.role = 'customer' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
        ORDER BY u.created_at DESC
      `;
      params.push(q, q, q);
    }

    const rows = await query<Record<string, unknown>>(sql, params);
    if (!rows || rows.length === 0) return [];

    return rows.map((r) => ({
      customer: {
        id: String(r.id),
        email: String(r.email),
        fullName: String(r.full_name || 'Valued Customer'),
        phone: r.phone ? String(r.phone) : undefined,
        avatarUrl: r.avatar_url ? String(r.avatar_url) : undefined,
        role: 'customer',
        isActive: Boolean(r.is_active),
        createdAt: String(r.created_at || new Date().toISOString()),
        updatedAt: String(r.updated_at || new Date().toISOString()),
      },
      orderCount: Number(r.order_count || 0),
      totalSpent: Number(r.total_spent || 0),
    }));
  } catch (err) {
    console.warn('[Customer Service Warning] Failed to fetch admin customers:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function getAdminCustomerDetail(
  adminUserId: string,
  customerId: string
): Promise<{
  customer: User;
  orders: Order[];
  addresses: Address[];
} | null> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized administrative access attempt.');
  }

  try {
    const userRows = await query<Record<string, unknown>>(
      `SELECT * FROM users WHERE id = ? LIMIT 1`,
      [customerId]
    );

    if (!userRows || userRows.length === 0) return null;
    const r = userRows[0];

    const customer: User = {
      id: String(r.id),
      email: String(r.email),
      fullName: String(r.full_name || 'Valued Customer'),
      phone: r.phone ? String(r.phone) : undefined,
      avatarUrl: r.avatar_url ? String(r.avatar_url) : undefined,
      role: (r.role as User['role']) || 'customer',
      isActive: Boolean(r.is_active),
      createdAt: String(r.created_at || new Date().toISOString()),
      updatedAt: String(r.updated_at || new Date().toISOString()),
    };

    const orderRows = await query<Record<string, unknown>>(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [customerId]
    );

    const orders: Order[] = (orderRows || []).map((o) => ({
      id: String(o.id),
      orderNumber: String(o.order_number),
      userId: String(o.user_id),
      shippingAddressId: String(o.shipping_address_id),
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discount_amount || 0),
      shippingFee: Number(o.shipping_fee || 0),
      taxAmount: Number(o.tax_amount || 0),
      totalAmount: Number(o.total_amount),
      status: (o.status as Order['status']) || 'payment_pending',
      paymentStatus: (o.payment_status as Order['paymentStatus']) || 'pending',
      items: [],
      createdAt: String(o.created_at),
      updatedAt: String(o.updated_at),
    }));

    const addrRows = await query<Record<string, unknown>>(
      `SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
      [customerId]
    );

    const addresses: Address[] = (addrRows || []).map((a) => ({
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
      addressType: (a.address_type as Address['addressType']) || 'home',
      isDefault: Boolean(a.is_default),
    }));

    return { customer, orders, addresses };
  } catch (err) {
    console.warn('[Customer Service Warning] Failed to fetch customer detail:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
