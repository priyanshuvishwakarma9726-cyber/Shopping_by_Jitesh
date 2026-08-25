'use server';

import { query } from '@/lib/db';
import { cryptoNativeUUID } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

export interface SavePushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Save user Push Subscription to TiDB Cloud (Requires Authenticated Session)
 */
export async function savePushSubscription(input: SavePushSubscriptionInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'You must be logged in to enable notifications.' };
    }

    if (!input.endpoint || !input.p256dh || !input.auth) {
      return { success: false, error: 'Invalid subscription parameters.' };
    }

    // Check if subscription endpoint already exists
    const existing = await query<Record<string, unknown>>(
      `SELECT id FROM push_subscriptions WHERE endpoint = ? LIMIT 1`,
      [input.endpoint]
    );

    if (existing && existing.length > 0) {
      // Update existing record with current user_id
      await query(
        `UPDATE push_subscriptions SET user_id = ?, p256dh = ?, auth = ?, updated_at = CURRENT_TIMESTAMP WHERE endpoint = ?`,
        [user.id, input.p256dh, input.auth, input.endpoint]
      );
    } else {
      // Insert new subscription record
      const id = cryptoNativeUUID();
      await query(
        `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)`,
        [id, user.id, input.endpoint, input.p256dh, input.auth]
      );
    }

    return { success: true };
  } catch (err) {
    console.warn('[Push Service Warning] Failed to save subscription:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to register notification subscription.' };
  }
}

/**
 * Remove Push Subscription from TiDB Cloud
 */
export async function deletePushSubscription(endpoint: string): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false };

    await query(`DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?`, [endpoint, user.id]);
    return { success: true };
  } catch (err) {
    console.warn('[Push Service Warning] Failed to delete subscription:', err instanceof Error ? err.message : String(err));
    return { success: false };
  }
}
