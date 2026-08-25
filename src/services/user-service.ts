'use server';

import { User } from '@/types';
import { query } from '@/lib/db';

export async function getOrCreateDbUser(
  userId: string,
  email: string,
  fullName: string,
  phone?: string
): Promise<User | null> {
  try {
    const existing = await query<Record<string, unknown>>(
      `SELECT * FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (existing && existing.length > 0) {
      const u = existing[0];
      return {
        id: String(u.id),
        email: String(u.email),
        fullName: String(u.full_name),
        phone: u.phone ? String(u.phone) : undefined,
        avatarUrl: u.avatar_url ? String(u.avatar_url) : undefined,
        role: (u.role as 'customer' | 'admin' | 'staff') || 'customer',
        isActive: Boolean(u.is_active),
        createdAt: String(u.created_at || new Date().toISOString()),
        updatedAt: String(u.updated_at || new Date().toISOString()),
      };
    }

    // Insert new profile
    await query(
      `INSERT INTO users (id, email, full_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, 'customer', TRUE)
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone)`,
      [userId, email, fullName || 'Valued Customer', phone || null]
    );

    return {
      id: userId,
      email,
      fullName: fullName || 'Valued Customer',
      phone,
      role: 'customer',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[User Service Warning] Unable to sync user profile with TiDB:', err instanceof Error ? err.message : String(err));
    return {
      id: userId,
      email,
      fullName: fullName || 'Valued Customer',
      phone,
      role: 'customer',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (rows && rows.length > 0) {
      const u = rows[0];
      return {
        id: String(u.id),
        email: String(u.email),
        fullName: String(u.full_name),
        phone: u.phone ? String(u.phone) : undefined,
        avatarUrl: u.avatar_url ? String(u.avatar_url) : undefined,
        role: (u.role as 'customer' | 'admin' | 'staff') || 'customer',
        isActive: Boolean(u.is_active),
        createdAt: String(u.created_at || new Date().toISOString()),
        updatedAt: String(u.updated_at || new Date().toISOString()),
      };
    }
  } catch (err) {
    console.warn('[User Service Warning] Unable to fetch user profile:', err instanceof Error ? err.message : String(err));
  }
  return null;
}

export async function updateUserProfile(
  userId: string,
  data: { fullName: string; phone?: string }
): Promise<boolean> {
  try {
    await query(
      `UPDATE users SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [data.fullName, data.phone || null, userId]
    );
    return true;
  } catch (err) {
    console.warn('[User Service Warning] Profile update failed:', err instanceof Error ? err.message : String(err));
    return false;
  }
}
