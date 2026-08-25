'use server';

import { query } from '@/lib/db';
import { Order, PaymentRecord } from '@/types';

export interface AdminOrderView {
  order: Order;
  customerName: string;
  customerEmail: string;
  payment: PaymentRecord;
  itemCount: number;
}

/**
 * Verify Server-Side Admin Role Authorization
 * Never trust client-side role properties or headers.
 */
export async function verifyAdminRole(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT role, email FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!rows || rows.length === 0) return false;
    const user = rows[0];

    // Admin authorization check: role === 'admin'
    return user.role === 'admin';
  } catch (err) {
    console.warn('[Admin Service Warning] Role verification failed:', err instanceof Error ? err.message : String(err));
    return false;
  }
}

export interface AdminDashboardStats {
  totalOrders: number;
  pendingPayments: number;
  confirmedOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  confirmedRevenue: number;
  recentOrders: AdminOrderView[];
}

/**
 * Fetch Real TiDB Dashboard Statistics for Admin Operations Center
 * Strictly calculates revenue ONLY from confirmed/delivered orders with approved payment.
 */
export async function getAdminDashboardStats(adminUserId: string): Promise<AdminDashboardStats> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized administrative access attempt.');
  }

  try {
    const [
      ordersCountRows,
      pendingCountRows,
      confirmedCountRows,
      customersCountRows,
      productsCountRows,
      lowStockRows,
      outOfStockRows,
      revenueRows,
    ] = await Promise.all([
      query<Record<string, unknown>>(`SELECT COUNT(*) as cnt FROM orders`),
      query<Record<string, unknown>>(`SELECT COUNT(*) as cnt FROM orders WHERE status = 'payment_pending'`),
      query<Record<string, unknown>>(`SELECT COUNT(*) as cnt FROM orders WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered')`),
      query<Record<string, unknown>>(`SELECT COUNT(*) as cnt FROM users WHERE role = 'customer'`),
      query<Record<string, unknown>>(`SELECT COUNT(*) as cnt FROM products`),
      query<Record<string, unknown>>(`SELECT COUNT(*) as cnt FROM inventory WHERE quantity_available <= 10 AND quantity_available > 0`),
      query<Record<string, unknown>>(`SELECT COUNT(*) as cnt FROM inventory WHERE quantity_available = 0`),
      query<Record<string, unknown>>(`SELECT SUM(total_amount) as rev FROM orders WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered') AND payment_status = 'approved'`),
    ]);

    const totalOrders = Number(ordersCountRows?.[0]?.cnt || 0);
    const pendingPayments = Number(pendingCountRows?.[0]?.cnt || 0);
    const confirmedOrders = Number(confirmedCountRows?.[0]?.cnt || 0);
    const totalCustomers = Number(customersCountRows?.[0]?.cnt || 0);
    const totalProducts = Number(productsCountRows?.[0]?.cnt || 0);
    const lowStockProducts = Number(lowStockRows?.[0]?.cnt || 0);
    const outOfStockProducts = Number(outOfStockRows?.[0]?.cnt || 0);
    const confirmedRevenue = Number(revenueRows?.[0]?.rev || 0);

    const recentOrders = await getAdminOrders(adminUserId, 'all');

    return {
      totalOrders,
      pendingPayments,
      confirmedOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      confirmedRevenue,
      recentOrders: recentOrders.slice(0, 5),
    };
  } catch (err) {
    console.warn('[Admin Service Warning] Failed to calculate dashboard stats:', err instanceof Error ? err.message : String(err));
    return {
      totalOrders: 0,
      pendingPayments: 0,
      confirmedOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      confirmedRevenue: 0,
      recentOrders: [],
    };
  }
}

/**
 * Fetch All Orders for Admin Review Portal
 */
export async function getAdminOrders(
  adminUserId: string,
  filterStatus?: string
): Promise<AdminOrderView[]> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized administrative access attempt.');
  }

  try {
    let sql = `
      SELECT o.*, 
             u.full_name as customer_name, 
             u.email as customer_email,
             p.id as payment_id,
             p.payment_method,
             p.transaction_reference,
             p.amount as payment_amount,
             p.currency as payment_currency,
             p.status as payment_status_record,
             p.proof_url,
             p.rejection_reason,
             p.reviewed_by,
             p.reviewed_at,
             p.created_at as payment_created_at,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON p.order_id = o.id
      ORDER BY o.created_at DESC
    `;

    const params: (string | number)[] = [];

    if (filterStatus && filterStatus !== 'all') {
      sql = `
        SELECT o.*, 
               u.full_name as customer_name, 
               u.email as customer_email,
               p.id as payment_id,
               p.payment_method,
               p.transaction_reference,
               p.amount as payment_amount,
               p.currency as payment_currency,
               p.status as payment_status_record,
               p.proof_url,
               p.rejection_reason,
               p.reviewed_by,
               p.reviewed_at,
               p.created_at as payment_created_at,
               (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN payments p ON p.order_id = o.id
        WHERE o.status = ? OR p.status = ?
        ORDER BY o.created_at DESC
      `;
      params.push(filterStatus, filterStatus);
    }

    const rows = await query<Record<string, unknown>>(sql, params);
    if (!rows || rows.length === 0) return [];

    return rows.map((r) => ({
      order: {
        id: String(r.id),
        orderNumber: String(r.order_number),
        userId: String(r.user_id),
        shippingAddressId: String(r.shipping_address_id),
        subtotal: Number(r.subtotal),
        discountAmount: Number(r.discount_amount || 0),
        shippingFee: Number(r.shipping_fee || 0),
        taxAmount: Number(r.tax_amount || 0),
        totalAmount: Number(r.total_amount),
        status: (r.status as Order['status']) || 'payment_pending',
        paymentStatus: (r.payment_status as Order['paymentStatus']) || 'pending',
        items: [],
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      },
      customerName: String(r.customer_name || 'Customer'),
      customerEmail: String(r.customer_email || ''),
      itemCount: Number(r.item_count || 0),
      payment: {
        id: String(r.payment_id || ''),
        orderId: String(r.id),
        paymentMethod: String(r.payment_method || 'Manual Transfer / UPI'),
        transactionReference: String(r.transaction_reference || 'N/A'),
        amount: Number(r.payment_amount || r.total_amount),
        currency: String(r.payment_currency || 'INR'),
        status: (r.payment_status_record as PaymentRecord['status']) || 'pending',
        proofUrl: r.proof_url ? String(r.proof_url) : undefined,
        rejectionReason: r.rejection_reason ? String(r.rejection_reason) : undefined,
        reviewedBy: r.reviewed_by ? String(r.reviewed_by) : undefined,
        reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
        createdAt: String(r.payment_created_at || r.created_at),
      },
    }));
  } catch (err) {
    console.warn('[Admin Service Warning] Failed to fetch admin orders:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Approve Customer Payment (Server-Side Admin Verification)
 */
export async function approvePayment(
  adminUserId: string,
  paymentId: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  try {
    // 1. Verify Payment & Order Current Status
    const payRows = await query<Record<string, unknown>>(
      `SELECT status FROM payments WHERE id = ? LIMIT 1`,
      [paymentId]
    );

    if (!payRows || payRows.length === 0) {
      return { success: false, error: 'Payment record not found.' };
    }

    if (payRows[0].status === 'approved') {
      return { success: false, error: 'This payment has already been approved.' };
    }

    // 2. Update Payment Record to APPROVED
    await query(
      `UPDATE payments 
       SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [adminUserId, paymentId]
    );

    // 3. Update Order Record to CONFIRMED
    await query(
      `UPDATE orders 
       SET status = 'confirmed', payment_status = 'approved', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [orderId]
    );

    return { success: true };
  } catch (err) {
    console.warn('[Admin Service Warning] Failed to approve payment:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to complete payment approval.' };
  }
}

/**
 * Reject Customer Payment with Reason (Server-Side Admin Verification)
 */
export async function rejectPayment(
  adminUserId: string,
  paymentId: string,
  orderId: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    return { success: false, error: 'Rejection reason is required.' };
  }

  try {
    // 1. Update Payment Record to REJECTED
    await query(
      `UPDATE payments 
       SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [rejectionReason.trim(), adminUserId, paymentId]
    );

    // 2. Update Order Record to PAYMENT_REJECTED
    await query(
      `UPDATE orders 
       SET status = 'payment_rejected', payment_status = 'rejected', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [orderId]
    );

    return { success: true };
  } catch (err) {
    console.warn('[Admin Service Warning] Failed to reject payment:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to process payment rejection.' };
  }
}
