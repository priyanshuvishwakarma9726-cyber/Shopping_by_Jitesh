/**
 * Server-side TiDB Cloud Database Connection Helper
 * Shopping by Jitesh
 * NEVER import this file into Client Components ('use client')
 */

import mysql from 'mysql2/promise';
import { getEnv, isDbConfigured } from './env';

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool | null {
  if (pool) return pool;

  if (!isDbConfigured()) {
    return null;
  }

  try {
    const env = getEnv();

    if (env.DATABASE_URL) {
      pool = mysql.createPool({
        uri: env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    } else {
      pool = mysql.createPool({
        host: env.TIDB_HOST,
        port: env.TIDB_PORT,
        user: env.TIDB_USER,
        password: env.TIDB_PASSWORD,
        database: env.TIDB_DATABASE,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }

    return pool;
  } catch (error) {
    console.warn('[TiDB Connection Notice] Unable to initialize pool, falling back to local dataset:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  const db = getDbPool();
  if (!db) return false;

  try {
    const [rows] = await db.query('SELECT 1 as health');
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    console.warn('[TiDB Health Check Warning] Health query ping failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[] | null> {
  const db = getDbPool();
  if (!db) return null;

  try {
    const [rows] = await db.query(sql, params);
    return rows as T[];
  } catch (error) {
    console.warn('[TiDB Query Warning] Query execution failed, falling back to mock dataset:', error instanceof Error ? error.message : String(error));
    return null;
  }
}
