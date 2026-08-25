'use server';

import { query, getDbPool } from '@/lib/db';
import { cryptoNativeUUID } from '@/lib/utils';
import { Order, OrderItem, PaymentRecord } from '@/types';
import { RowDataPacket } from 'mysql2/promise';

export interface CreateOrderItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

/**
 * Server-side Order Creation with Server-Side Pricing & Inventory Validation
 * NEVER trust client-provided product prices, totals, or stock counts.
 */
export async function createOrder(
  userId: string,
  addressId: string,
  items: CreateOrderItemInput[],
  transactionRef: string,
  proofUrl?: string
): Promise<CreateOrderResult> {
  if (!items || items.length === 0) {
    return { success: false, error: 'Your shopping bag is empty.' };
  }

  if (!transactionRef || transactionRef.trim().length === 0) {
    return { success: false, error: 'Transaction / Reference ID is required.' };
  }

  const pool = getDbPool();
  if (!pool) {
    return { success: false, error: 'Database connection currently unavailable.' };
  }

  const conn = await pool.getConnection();

  try {
    // 1. Verify Shipping Address Ownership
    const [addrRows] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM addresses WHERE id = ? AND user_id = ? LIMIT 1`,
      [addressId, userId]
    );

    if (!addrRows || addrRows.length === 0) {
      conn.release();
      return { success: false, error: 'Invalid or unauthorized shipping address selected.' };
    }

    // 2. Query Live Product Prices & Inventory Stock from TiDB (Server-Side Pricing)
    let calculatedSubtotal = 0;
    const validatedItems: {
      productId: string;
      variantId?: string | null;
      productTitle: string;
      variantTitle?: string | null;
      sku: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
    }[] = [];

    for (const item of items) {
      const [prodRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, title, sku, base_price, sale_price, is_active FROM products WHERE id = ? LIMIT 1`,
        [item.productId]
      );

      if (!prodRows || prodRows.length === 0 || !prodRows[0].is_active) {
        conn.release();
        return { success: false, error: `One or more items in your cart are no longer available.` };
      }

      const p = prodRows[0];
      let unitPrice = Number(p.sale_price ?? p.base_price);
      let variantTitle: string | null = null;
      let sku = String(p.sku);

      if (item.variantId) {
        const [varRows] = await conn.query<RowDataPacket[]>(
          `SELECT id, title, sku, price_modifier FROM product_variants WHERE id = ? AND product_id = ? LIMIT 1`,
          [item.variantId, item.productId]
        );
        if (varRows && varRows.length > 0) {
          unitPrice += Number(varRows[0].price_modifier || 0);
          variantTitle = String(varRows[0].title);
          sku = String(varRows[0].sku);
        }
      }

      // Check stock availability in inventory
      const [invRows] = await conn.query<RowDataPacket[]>(
        `SELECT quantity_available FROM inventory WHERE product_id = ? LIMIT 1`,
        [item.productId]
      );

      const availableStock = invRows && invRows.length > 0 ? Number(invRows[0].quantity_available) : 0;
      if (availableStock < item.quantity) {
        conn.release();
        return {
          success: false,
          error: `Some items are no longer available in the requested quantity. (${p.title})`,
        };
      }

      const lineTotal = unitPrice * item.quantity;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        productTitle: String(p.title),
        variantTitle,
        sku,
        unitPrice,
        quantity: item.quantity,
        totalPrice: lineTotal,
      });
    }

    // Server-side Financial Calculations
    const discountAmount = 0.0;
    const shippingFee = 0.0; // Free Shipping
    const taxAmount = 0.0; // Configurable tax (0.00 for this phase)
    const finalTotal = calculatedSubtotal - discountAmount + shippingFee + taxAmount;

    // Generate Order ID & Order Number
    const orderId = cryptoNativeUUID();
    const orderNumber = `SBJ-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    // START TRANSACTION
    await conn.beginTransaction();

    // Insert Order Record
    await conn.query(
      `INSERT INTO orders (id, order_number, user_id, shipping_address_id, subtotal, discount_amount, shipping_fee, tax_amount, total_amount, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'payment_pending', 'pending')`,
      [
        orderId,
        orderNumber,
        userId,
        addressId,
        calculatedSubtotal,
        discountAmount,
        shippingFee,
        taxAmount,
        finalTotal,
      ]
    );

    // Insert Order Items & Deduct Inventory Stock
    for (const vi of validatedItems) {
      const orderItemId = cryptoNativeUUID();
      await conn.query(
        `INSERT INTO order_items (id, order_id, product_id, variant_id, product_title, variant_title, sku, unit_price, quantity, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderItemId,
          orderId,
          vi.productId,
          vi.variantId,
          vi.productTitle,
          vi.variantTitle,
          vi.sku,
          vi.unitPrice,
          vi.quantity,
          vi.totalPrice,
        ]
      );

      // Deduct available stock
      await conn.query(
        `UPDATE inventory SET quantity_available = GREATEST(0, quantity_available - ?) WHERE product_id = ?`,
        [vi.quantity, vi.productId]
      );
    }

    // Insert Payment Record
    const paymentId = cryptoNativeUUID();
    await conn.query(
      `INSERT INTO payments (id, order_id, payment_method, transaction_reference, amount, currency, status, proof_url)
       VALUES (?, ?, 'Manual Transfer / UPI', ?, ?, 'INR', 'pending', ?)`,
      [paymentId, orderId, transactionRef.trim(), finalTotal, proofUrl || null]
    );

    // COMMIT TRANSACTION
    await conn.commit();
    conn.release();

    return {
      success: true,
      orderId,
      orderNumber,
    };
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // Ignore rollback errors
    }
    conn.release();
    console.warn('[Order Service Warning] Order creation failed:', err instanceof Error ? err.message : String(err));
    return {
      success: false,
      error: 'An unexpected error occurred while placing your order. Please try again.',
    };
  }
}

/**
 * Get Customer Order History (Strict Ownership Enforcement)
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT o.*, 
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    if (!rows || rows.length === 0) return [];

    return rows.map((r) => ({
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
    }));
  } catch (err) {
    console.warn('[Order Service Warning] Failed to fetch user orders:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Get Single Customer Order Details by ID (Strict Ownership Verification)
 */
export async function getUserOrderById(userId: string, orderId: string): Promise<{
  order: Order;
  items: OrderItem[];
  payment?: PaymentRecord;
  address?: Record<string, unknown> | null;
} | null> {
  try {
    // 1. Fetch Order Record
    const orderRows = await query<Record<string, unknown>>(
      `SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1`,
      [orderId, userId]
    );

    if (!orderRows || orderRows.length === 0) return null;
    const o = orderRows[0];

    // 2. Fetch Order Items
    const itemRows = await query<Record<string, unknown>>(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    const items: OrderItem[] = (itemRows || []).map((i) => ({
      id: String(i.id),
      orderId: String(i.order_id),
      productId: String(i.product_id),
      variantId: i.variant_id ? String(i.variant_id) : undefined,
      productTitle: String(i.product_title),
      variantTitle: i.variant_title ? String(i.variant_title) : undefined,
      sku: String(i.sku),
      unitPrice: Number(i.unit_price),
      quantity: Number(i.quantity),
      totalPrice: Number(i.total_price),
    }));

    // 3. Fetch Payment Record
    const payRows = await query<Record<string, unknown>>(
      `SELECT * FROM payments WHERE order_id = ? LIMIT 1`,
      [orderId]
    );

    let payment: PaymentRecord | undefined = undefined;
    if (payRows && payRows.length > 0) {
      const p = payRows[0];
      payment = {
        id: String(p.id),
        orderId: String(p.order_id),
        paymentMethod: String(p.payment_method || 'Manual Transfer / UPI'),
        transactionReference: String(p.transaction_reference),
        amount: Number(p.amount),
        currency: String(p.currency || 'INR'),
        status: (p.status as PaymentRecord['status']) || 'pending',
        proofUrl: p.proof_url ? String(p.proof_url) : undefined,
        rejectionReason: p.rejection_reason ? String(p.rejection_reason) : undefined,
        reviewedBy: p.reviewed_by ? String(p.reviewed_by) : undefined,
        reviewedAt: p.reviewed_at ? String(p.reviewed_at) : undefined,
        createdAt: String(p.created_at),
      };
    }

    // 4. Fetch Address Record
    const addrRows = await query<Record<string, unknown>>(
      `SELECT * FROM addresses WHERE id = ? LIMIT 1`,
      [o.shipping_address_id]
    );

    const address = addrRows && addrRows.length > 0 ? addrRows[0] : null;

    const order: Order = {
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
      items,
      createdAt: String(o.created_at),
      updatedAt: String(o.updated_at),
    };

    return { order, items, payment, address };
  } catch (err) {
    console.warn('[Order Service Warning] Failed to fetch order by ID:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Resubmit Payment Proof for Rejected Orders
 */
export async function resubmitPaymentProof(
  userId: string,
  orderId: string,
  transactionRef: string,
  proofUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify Order Ownership
    const orderRows = await query<Record<string, unknown>>(
      `SELECT id, status FROM orders WHERE id = ? AND user_id = ? LIMIT 1`,
      [orderId, userId]
    );

    if (!orderRows || orderRows.length === 0) {
      return { success: false, error: 'Order not found or access denied.' };
    }

    // Update Payment Record
    await query(
      `UPDATE payments 
       SET transaction_reference = ?, proof_url = ?, status = 'pending', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE order_id = ?`,
      [transactionRef.trim(), proofUrl || null, orderId]
    );

    // Update Order Status
    await query(
      `UPDATE orders SET status = 'payment_pending', payment_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [orderId]
    );

    return { success: true };
  } catch (err) {
    console.warn('[Order Service Warning] Failed to resubmit payment proof:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Unable to resubmit payment proof.' };
  }
}
