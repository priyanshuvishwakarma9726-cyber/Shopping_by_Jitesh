'use server';

import { Product, Category, ProductFilterState } from '@/types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from './mock-data';
import { query } from '@/lib/db';

export async function getCategories(): Promise<Category[]> {
  try {
    const rows = await query<Record<string, unknown>>(`SELECT * FROM categories ORDER BY sort_order ASC`);
    if (rows && rows.length > 0) {
      return rows.map((c) => ({
        id: String(c.id),
        name: String(c.name),
        slug: String(c.slug),
        description: c.description ? String(c.description) : undefined,
        imageUrl: c.image_url ? String(c.image_url) : undefined,
        icon: c.icon ? String(c.icon) : undefined,
        isFeatured: Boolean(c.is_featured),
        sortOrder: Number(c.sort_order || 0),
      }));
    }
  } catch {
    // Fallback to mock categories
  }
  return MOCK_CATEGORIES;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM categories WHERE slug = ? LIMIT 1`,
      [slug]
    );
    if (rows && rows.length > 0) {
      const c = rows[0];
      return {
        id: String(c.id),
        name: String(c.name),
        slug: String(c.slug),
        description: c.description ? String(c.description) : undefined,
        imageUrl: c.image_url ? String(c.image_url) : undefined,
        icon: c.icon ? String(c.icon) : undefined,
        isFeatured: Boolean(c.is_featured),
        sortOrder: Number(c.sort_order || 0),
      };
    }
  } catch {
    // Fallback
  }
  const found = MOCK_CATEGORIES.find((c) => c.slug === slug);
  return found || null;
}

export async function getProducts(filters?: ProductFilterState): Promise<{
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, filters?.page || 1);
  const pageSize = Math.max(1, Math.min(48, filters?.pageSize || 12));
  const offset = (page - 1) * pageSize;

  try {
    const whereConditions: string[] = ['p.is_active = TRUE'];
    const queryParams: unknown[] = [];

    if (filters?.categorySlug) {
      whereConditions.push('c.slug = ?');
      queryParams.push(filters.categorySlug);
    }

    if (filters?.searchQuery) {
      const searchPattern = `%${filters.searchQuery.trim()}%`;
      whereConditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR c.name LIKE ?)');
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (filters?.minPrice !== undefined) {
      whereConditions.push('COALESCE(p.sale_price, p.base_price) >= ?');
      queryParams.push(filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      whereConditions.push('COALESCE(p.sale_price, p.base_price) <= ?');
      queryParams.push(filters.maxPrice);
    }

    if (filters?.rating !== undefined && filters.rating > 0) {
      whereConditions.push('p.average_rating >= ?');
      queryParams.push(filters.rating);
    }

    if (filters?.inStockOnly) {
      whereConditions.push('p.is_active = TRUE');
    }

    const whereClause = whereConditions.join(' AND ');

    // Safe Whitelist Order By Clause
    let orderByClause = 'p.is_featured DESC, p.created_at DESC';
    if (filters?.sortBy === 'price-low') {
      orderByClause = 'COALESCE(p.sale_price, p.base_price) ASC';
    } else if (filters?.sortBy === 'price-high') {
      orderByClause = 'COALESCE(p.sale_price, p.base_price) DESC';
    } else if (filters?.sortBy === 'rating') {
      orderByClause = 'p.average_rating DESC';
    } else if (filters?.sortBy === 'newest') {
      orderByClause = 'p.created_at DESC';
    }

    // Count Query
    const countSql = `SELECT COUNT(*) as total_count FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${whereClause}`;
    const countRows = await query<Record<string, unknown>>(countSql, queryParams);

    if (countRows && countRows.length > 0) {
      const total = Number(countRows[0].total_count || 0);

      // Data Query with LIMIT and OFFSET
      const dataSql = `
        SELECT p.*, c.name as category_name, c.slug as category_slug, img.image_url as primary_image
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = TRUE
        WHERE ${whereClause}
        ORDER BY ${orderByClause}
        LIMIT ? OFFSET ?
      `;

      const dataRows = await query<Record<string, unknown>>(dataSql, [...queryParams, pageSize, offset]);

      if (dataRows) {
        const products = mapDbProducts(dataRows);
        return {
          products,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        };
      }
    }
  } catch {
    // Fallback to mock data filtering & pagination
  }

  // Fallback Mock Filtering
  let result = [...MOCK_PRODUCTS];

  if (filters?.categorySlug) {
    result = result.filter((p) => p.categorySlug === filters.categorySlug);
  }

  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (filters?.minPrice !== undefined) {
    result = result.filter((p) => (p.salePrice ?? p.basePrice) >= (filters.minPrice ?? 0));
  }

  if (filters?.maxPrice !== undefined) {
    result = result.filter((p) => (p.salePrice ?? p.basePrice) <= (filters.maxPrice ?? Infinity));
  }

  if (filters?.rating !== undefined && filters.rating > 0) {
    result = result.filter((p) => p.averageRating >= filters.rating!);
  }

  if (filters?.inStockOnly) {
    result = result.filter((p) => p.inStock);
  }

  if (filters?.sortBy === 'price-low') {
    result.sort((a, b) => (a.salePrice ?? a.basePrice) - (b.salePrice ?? b.basePrice));
  } else if (filters?.sortBy === 'price-high') {
    result.sort((a, b) => (b.salePrice ?? b.basePrice) - (a.salePrice ?? a.basePrice));
  } else if (filters?.sortBy === 'rating') {
    result.sort((a, b) => b.averageRating - a.averageRating);
  } else if (filters?.sortBy === 'newest') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = result.length;
  const paginatedProducts = result.slice(offset, offset + pageSize);

  return {
    products: paginatedProducts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? LIMIT 1`,
      [slug]
    );

    if (rows && rows.length > 0) {
      const p = rows[0];
      const productId = String(p.id);

      // Fetch Product Images
      const imageRows = await query<Record<string, unknown>>(
        `SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC`,
        [productId]
      );

      // Fetch Product Variants
      const variantRows = await query<Record<string, unknown>>(
        `SELECT * FROM product_variants WHERE product_id = ? AND is_active = TRUE`,
        [productId]
      );

      const images = (imageRows || []).map((img, index) => ({
        id: String(img.id),
        productId,
        imageUrl: String(img.image_url),
        altText: img.alt_text ? String(img.alt_text) : undefined,
        isPrimary: Boolean(img.is_primary || index === 0),
        displayOrder: Number(img.display_order || index + 1),
      }));

      const variants = (variantRows || []).map((v) => ({
        id: String(v.id),
        productId,
        title: String(v.title),
        sku: String(v.sku),
        priceModifier: Number(v.price_modifier || 0),
        attributes: typeof v.attributes === 'string' ? JSON.parse(v.attributes) : (v.attributes as Record<string, string>) || {},
        isActive: Boolean(v.is_active),
      }));

      return {
        id: productId,
        categoryId: String(p.category_id),
        categoryName: p.category_name ? String(p.category_name) : undefined,
        categorySlug: p.category_slug ? String(p.category_slug) : undefined,
        title: String(p.title),
        slug: String(p.slug),
        shortDescription: p.short_description ? String(p.short_description) : undefined,
        description: String(p.description),
        basePrice: Number(p.base_price),
        salePrice: p.sale_price ? Number(p.sale_price) : null,
        sku: String(p.sku),
        brand: String(p.brand || 'Shopping by Jitesh'),
        isFeatured: Boolean(p.is_featured),
        isNewArrival: Boolean(p.is_new_arrival),
        isBestSeller: Boolean(p.is_best_seller),
        isActive: Boolean(p.is_active),
        averageRating: Number(p.average_rating || 0),
        reviewCount: Number(p.review_count || 0),
        inStock: true,
        images: images.length > 0 ? images : [
          {
            id: `img-${productId}`,
            productId,
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
            isPrimary: true,
            displayOrder: 1,
          },
        ],
        variants,
        createdAt: String(p.created_at || new Date().toISOString()),
        updatedAt: String(p.updated_at || new Date().toISOString()),
      };
    }
  } catch {
    // Fallback
  }
  const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
  return found || null;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { products } = await getProducts({ sortBy: 'featured', pageSize: 8 });
  return products.filter((p) => p.isFeatured).slice(0, 8);
}

export async function getTrendingProducts(): Promise<Product[]> {
  const { products } = await getProducts({ sortBy: 'rating', pageSize: 8 });
  return products.slice(0, 8);
}

export async function getBestSellingProducts(): Promise<Product[]> {
  const { products } = await getProducts({ pageSize: 8 });
  return products.filter((p) => p.isBestSeller).slice(0, 8);
}

export async function getDealProducts(): Promise<Product[]> {
  const { products } = await getProducts({ pageSize: 8 });
  return products.filter((p) => p.salePrice && p.salePrice < p.basePrice).slice(0, 8);
}

export async function getRelatedProducts(currentSlug: string, categorySlug?: string): Promise<Product[]> {
  const { products } = await getProducts({ categorySlug, pageSize: 8 });
  return products.filter((p) => p.slug !== currentSlug).slice(0, 4);
}

function mapDbProducts(rows: Record<string, unknown>[]): Product[] {
  return rows.map((r) => {
    const id = String(r.id);
    const imageUrl = r.primary_image ? String(r.primary_image) : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
    return {
      id,
      categoryId: String(r.category_id),
      categoryName: r.category_name ? String(r.category_name) : undefined,
      categorySlug: r.category_slug ? String(r.category_slug) : undefined,
      title: String(r.title),
      slug: String(r.slug),
      shortDescription: r.short_description ? String(r.short_description) : undefined,
      description: String(r.description),
      basePrice: Number(r.base_price),
      salePrice: r.sale_price ? Number(r.sale_price) : null,
      sku: String(r.sku),
      brand: String(r.brand || 'Shopping by Jitesh'),
      isFeatured: Boolean(r.is_featured),
      isNewArrival: Boolean(r.is_new_arrival),
      isBestSeller: Boolean(r.is_best_seller),
      isActive: Boolean(r.is_active),
      averageRating: Number(r.average_rating || 0),
      reviewCount: Number(r.review_count || 0),
      inStock: true,
      images: [
        {
          id: `img-${id}`,
          productId: id,
          imageUrl,
          isPrimary: true,
          displayOrder: 1,
        },
      ],
      createdAt: String(r.created_at || new Date().toISOString()),
      updatedAt: String(r.updated_at || new Date().toISOString()),
    };
  });
}

/**
 * Admin Category Operations (Server-Side Admin Role Verification)
 */
export interface AdminCategoryInput {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  isFeatured?: boolean;
  sortOrder?: number;
}

export async function createCategory(
  adminUserId: string,
  input: AdminCategoryInput
): Promise<{ success: boolean; error?: string }> {
  const { verifyAdminRole } = await import('@/services/admin-service');
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) return { success: false, error: 'Unauthorized: Admin privileges required.' };

  if (!input.name || !input.slug) {
    return { success: false, error: 'Category name and slug are required.' };
  }

  const { cryptoNativeUUID } = await import('@/lib/utils');
  const catId = cryptoNativeUUID();
  const cleanSlug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

  try {
    const existing = await query<Record<string, unknown>>(`SELECT id FROM categories WHERE slug = ? LIMIT 1`, [cleanSlug]);
    if (existing && existing.length > 0) {
      return { success: false, error: `Category slug '${cleanSlug}' already exists.` };
    }

    await query(
      `INSERT INTO categories (id, name, slug, description, image_url, icon, is_featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        catId,
        input.name.trim(),
        cleanSlug,
        input.description ? input.description.trim() : null,
        input.imageUrl ? input.imageUrl.trim() : null,
        input.icon ? input.icon.trim() : null,
        input.isFeatured ?? false,
        input.sortOrder ?? 0,
      ]
    );

    return { success: true };
  } catch (err) {
    console.warn('[Product Service Warning] Failed to create category:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to create category.' };
  }
}

export async function updateCategory(
  adminUserId: string,
  categoryId: string,
  input: AdminCategoryInput
): Promise<{ success: boolean; error?: string }> {
  const { verifyAdminRole } = await import('@/services/admin-service');
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) return { success: false, error: 'Unauthorized: Admin privileges required.' };

  if (!input.name || !input.slug) {
    return { success: false, error: 'Category name and slug are required.' };
  }

  const cleanSlug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

  try {
    const existing = await query<Record<string, unknown>>(
      `SELECT id FROM categories WHERE slug = ? AND id != ? LIMIT 1`,
      [cleanSlug, categoryId]
    );
    if (existing && existing.length > 0) {
      return { success: false, error: `Category slug '${cleanSlug}' is already taken.` };
    }

    await query(
      `UPDATE categories
       SET name = ?, slug = ?, description = ?, image_url = ?, icon = ?, is_featured = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        input.name.trim(),
        cleanSlug,
        input.description ? input.description.trim() : null,
        input.imageUrl ? input.imageUrl.trim() : null,
        input.icon ? input.icon.trim() : null,
        input.isFeatured ?? false,
        input.sortOrder ?? 0,
        categoryId,
      ]
    );

    return { success: true };
  } catch (err) {
    console.warn('[Product Service Warning] Failed to update category:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to update category.' };
  }
}

/**
 * Admin Product Operations (Server-Side Admin Role Verification)
 */
export interface AdminProductInput {
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  basePrice: number;
  salePrice?: number | null;
  sku: string;
  brand?: string;
  categoryId: string;
  imageUrl?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
  initialStock?: number;
}

export async function createProduct(
  adminUserId: string,
  input: AdminProductInput
): Promise<{ success: boolean; error?: string }> {
  const { verifyAdminRole } = await import('@/services/admin-service');
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) return { success: false, error: 'Unauthorized: Admin privileges required.' };

  if (!input.title || !input.slug || !input.sku || !input.categoryId) {
    return { success: false, error: 'Title, slug, SKU, and category are required.' };
  }

  if (input.basePrice <= 0 || isNaN(input.basePrice)) {
    return { success: false, error: 'Base price must be greater than zero.' };
  }

  if (input.salePrice !== undefined && input.salePrice !== null && input.salePrice > input.basePrice) {
    return { success: false, error: 'Sale price cannot be greater than base price.' };
  }

  const cleanSlug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanSku = input.sku.trim().toUpperCase();

  try {
    const existingSlug = await query<Record<string, unknown>>(`SELECT id FROM products WHERE slug = ? LIMIT 1`, [cleanSlug]);
    if (existingSlug && existingSlug.length > 0) {
      return { success: false, error: `Product slug '${cleanSlug}' already exists.` };
    }

    const existingSku = await query<Record<string, unknown>>(`SELECT id FROM products WHERE sku = ? LIMIT 1`, [cleanSku]);
    if (existingSku && existingSku.length > 0) {
      return { success: false, error: `SKU '${cleanSku}' already exists.` };
    }

    const { cryptoNativeUUID } = await import('@/lib/utils');
    const productId = cryptoNativeUUID();

    // 1. Insert Product
    await query(
      `INSERT INTO products (id, category_id, title, slug, short_description, description, base_price, sale_price, sku, brand, is_featured, is_new_arrival, is_best_seller, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        input.categoryId,
        input.title.trim(),
        cleanSlug,
        input.shortDescription ? input.shortDescription.trim() : null,
        input.description ? input.description.trim() : input.title.trim(),
        input.basePrice,
        input.salePrice || null,
        cleanSku,
        input.brand ? input.brand.trim() : 'Shopping by Jitesh',
        input.isFeatured ?? false,
        input.isNewArrival ?? true,
        input.isBestSeller ?? false,
        input.isActive ?? true,
      ]
    );

    // 2. Insert Primary Image
    const imgId = cryptoNativeUUID();
    const primaryImgUrl = input.imageUrl && input.imageUrl.trim().length > 0
      ? input.imageUrl.trim()
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';

    await query(
      `INSERT INTO product_images (id, product_id, image_url, is_primary, display_order)
       VALUES (?, ?, ?, TRUE, 1)`,
      [imgId, productId, primaryImgUrl]
    );

    // 3. Insert Inventory Stock Record
    const invId = cryptoNativeUUID();
    const stockQty = input.initialStock !== undefined ? Math.max(0, input.initialStock) : 50;

    await query(
      `INSERT INTO inventory (id, product_id, quantity_available, quantity_reserved, low_stock_threshold)
       VALUES (?, ?, ?, 0, 10)`,
      [invId, productId, stockQty]
    );

    return { success: true };
  } catch (err) {
    console.warn('[Product Service Warning] Failed to create product:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to create product.' };
  }
}

export async function updateProduct(
  adminUserId: string,
  productId: string,
  input: AdminProductInput
): Promise<{ success: boolean; error?: string }> {
  const { verifyAdminRole } = await import('@/services/admin-service');
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) return { success: false, error: 'Unauthorized: Admin privileges required.' };

  if (!input.title || !input.slug || !input.sku || !input.categoryId) {
    return { success: false, error: 'Title, slug, SKU, and category are required.' };
  }

  if (input.basePrice <= 0 || isNaN(input.basePrice)) {
    return { success: false, error: 'Base price must be greater than zero.' };
  }

  if (input.salePrice !== undefined && input.salePrice !== null && input.salePrice > input.basePrice) {
    return { success: false, error: 'Sale price cannot be greater than base price.' };
  }

  const cleanSlug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanSku = input.sku.trim().toUpperCase();

  try {
    const existingSlug = await query<Record<string, unknown>>(
      `SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1`,
      [cleanSlug, productId]
    );
    if (existingSlug && existingSlug.length > 0) {
      return { success: false, error: `Product slug '${cleanSlug}' is already taken.` };
    }

    const existingSku = await query<Record<string, unknown>>(
      `SELECT id FROM products WHERE sku = ? AND id != ? LIMIT 1`,
      [cleanSku, productId]
    );
    if (existingSku && existingSku.length > 0) {
      return { success: false, error: `SKU '${cleanSku}' is already taken.` };
    }

    await query(
      `UPDATE products
       SET category_id = ?, title = ?, slug = ?, short_description = ?, description = ?, base_price = ?, sale_price = ?, sku = ?, brand = ?, is_featured = ?, is_new_arrival = ?, is_best_seller = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        input.categoryId,
        input.title.trim(),
        cleanSlug,
        input.shortDescription ? input.shortDescription.trim() : null,
        input.description ? input.description.trim() : input.title.trim(),
        input.basePrice,
        input.salePrice || null,
        cleanSku,
        input.brand ? input.brand.trim() : 'Shopping by Jitesh',
        input.isFeatured ?? false,
        input.isNewArrival ?? false,
        input.isBestSeller ?? false,
        input.isActive ?? true,
        productId,
      ]
    );

    if (input.imageUrl && input.imageUrl.trim().length > 0) {
      await query(
        `UPDATE product_images SET image_url = ? WHERE product_id = ? AND is_primary = TRUE`,
        [input.imageUrl.trim(), productId]
      );
    }

    return { success: true };
  } catch (err) {
    console.warn('[Product Service Warning] Failed to update product:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to update product.' };
  }
}

export async function toggleProductActive(
  adminUserId: string,
  productId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const { verifyAdminRole } = await import('@/services/admin-service');
  const isAdmin = await verifyAdminRole(adminUserId);
  if (!isAdmin) return { success: false, error: 'Unauthorized: Admin privileges required.' };

  try {
    await query(
      `UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [isActive, productId]
    );

    return { success: true };
  } catch (err) {
    console.warn('[Product Service Warning] Failed to toggle product status:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to update product status.' };
  }
}
