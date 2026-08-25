'use server';

import { query } from '@/lib/db';
import { verifyAdminRole } from '@/services/admin-service';

export interface AdminInventoryItem {
  id: string;
  productId: string;
  productTitle: string;
  sku: string;
  categoryName: string;
  quantityAvailable: number;
  quantityReserved: number;
  lowStockThreshold: number;
  warehouseLocation: string;
  updatedAt: string;
}

export async function getAdminInventory(
  adminUserId: string,
  search?: string
): Promise<AdminInventoryItem[]> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized administrative access attempt.');
  }

  try {
    let sql = `
      SELECT i.*, 
             p.title as product_title, 
             p.sku as product_sku,
             c.name as category_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      ORDER BY i.quantity_available ASC
    `;

    const params: string[] = [];

    if (search && search.trim().length > 0) {
      const q = `%${search.trim()}%`;
      sql = `
        SELECT i.*, 
               p.title as product_title, 
               p.sku as product_sku,
               c.name as category_name
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE p.title LIKE ? OR p.sku LIKE ? OR c.name LIKE ?
        ORDER BY i.quantity_available ASC
      `;
      params.push(q, q, q);
    }

    const rows = await query<Record<string, unknown>>(sql, params);
    if (!rows || rows.length === 0) return [];

    return rows.map((r) => ({
      id: String(r.id),
      productId: String(r.product_id),
      productTitle: String(r.product_title),
      sku: String(r.product_sku || r.sku || 'N/A'),
      categoryName: String(r.category_name || 'General'),
      quantityAvailable: Number(r.quantity_available || 0),
      quantityReserved: Number(r.quantity_reserved || 0),
      lowStockThreshold: Number(r.low_stock_threshold || 10),
      warehouseLocation: String(r.warehouse_location || 'Main Hub'),
      updatedAt: String(r.updated_at || new Date().toISOString()),
    }));
  } catch (err) {
    console.warn('[Inventory Service Warning] Failed to fetch admin inventory:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function updateInventoryStock(
  adminUserId: string,
  inventoryId: string,
  newQuantity: number
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  if (newQuantity < 0 || isNaN(newQuantity)) {
    return { success: false, error: 'Quantity available cannot be negative.' };
  }

  try {
    await query(
      `UPDATE inventory SET quantity_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [Math.floor(newQuantity), inventoryId]
    );

    return { success: true };
  } catch (err) {
    console.warn('[Inventory Service Warning] Failed to update stock:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to update inventory stock.' };
  }
}
