'use server';

import { query } from '@/lib/db';
import { verifyAdminRole } from '@/services/admin-service';

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  orderCount: number;
  revenue: number;
}

export interface TopProductPerformance {
  productId: string;
  productTitle: string;
  sku: string;
  unitsSold: number;
  revenueGenerated: number;
}

export interface AdminAnalyticsData {
  confirmedRevenue: number;
  pendingRevenue: number;
  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  rejectedOrders: number;
  cancelledOrders: number;
  categoryBreakdown: CategoryPerformance[];
  topProducts: TopProductPerformance[];
}

export async function getAdminAnalytics(adminUserId: string): Promise<AdminAnalyticsData> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized administrative access attempt.');
  }

  try {
    const [
      confirmedRevRows,
      pendingRevRows,
      statusCountsRows,
      catRows,
      topProdRows,
    ] = await Promise.all([
      query<Record<string, unknown>>(`SELECT SUM(total_amount) as rev FROM orders WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered') AND payment_status = 'approved'`),
      query<Record<string, unknown>>(`SELECT SUM(total_amount) as rev FROM orders WHERE status = 'payment_pending'`),
      query<Record<string, unknown>>(`SELECT status, COUNT(*) as cnt FROM orders GROUP BY status`),
      query<Record<string, unknown>>(`
        SELECT c.id as category_id, c.name as category_name, 
               COUNT(DISTINCT o.id) as order_count, 
               COALESCE(SUM(oi.total_price), 0) as revenue
        FROM categories c
        JOIN products p ON p.category_id = c.id
        JOIN order_items oi ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered') AND o.payment_status = 'approved'
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `),
      query<Record<string, unknown>>(`
        SELECT p.id as product_id, p.title as product_title, p.sku,
               COALESCE(SUM(oi.quantity), 0) as units_sold,
               COALESCE(SUM(oi.total_price), 0) as revenue_generated
        FROM products p
        JOIN order_items oi ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered') AND o.payment_status = 'approved'
        GROUP BY p.id, p.title, p.sku
        ORDER BY revenue_generated DESC
        LIMIT 5
      `),
    ]);

    const confirmedRevenue = Number(confirmedRevRows?.[0]?.rev || 0);
    const pendingRevenue = Number(pendingRevRows?.[0]?.rev || 0);

    let totalOrders = 0;
    let confirmedOrders = 0;
    let pendingOrders = 0;
    let rejectedOrders = 0;
    let cancelledOrders = 0;

    (statusCountsRows || []).forEach((r) => {
      const st = String(r.status);
      const cnt = Number(r.cnt || 0);
      totalOrders += cnt;

      if (['confirmed', 'processing', 'shipped', 'delivered'].includes(st)) {
        confirmedOrders += cnt;
      } else if (st === 'payment_pending') {
        pendingOrders += cnt;
      } else if (st === 'payment_rejected') {
        rejectedOrders += cnt;
      } else if (st === 'cancelled') {
        cancelledOrders += cnt;
      }
    });

    const categoryBreakdown: CategoryPerformance[] = (catRows || []).map((r) => ({
      categoryId: String(r.category_id),
      categoryName: String(r.category_name),
      orderCount: Number(r.order_count || 0),
      revenue: Number(r.revenue || 0),
    }));

    const topProducts: TopProductPerformance[] = (topProdRows || []).map((r) => ({
      productId: String(r.product_id),
      productTitle: String(r.product_title),
      sku: String(r.sku),
      unitsSold: Number(r.units_sold || 0),
      revenueGenerated: Number(r.revenue_generated || 0),
    }));

    return {
      confirmedRevenue,
      pendingRevenue,
      totalOrders,
      confirmedOrders,
      pendingOrders,
      rejectedOrders,
      cancelledOrders,
      categoryBreakdown,
      topProducts,
    };
  } catch (err) {
    console.warn('[Analytics Service Warning] Failed to compute analytics data:', err instanceof Error ? err.message : String(err));
    return {
      confirmedRevenue: 0,
      pendingRevenue: 0,
      totalOrders: 0,
      confirmedOrders: 0,
      pendingOrders: 0,
      rejectedOrders: 0,
      cancelledOrders: 0,
      categoryBreakdown: [],
      topProducts: [],
    };
  }
}
