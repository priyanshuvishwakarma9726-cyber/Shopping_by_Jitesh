/**
 * Environment Variables Configuration & Security Validation
 * Shopping by Jitesh
 */

export interface AppEnv {
  // App Config
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL: string;

  // Database (TiDB Cloud)
  DATABASE_URL?: string;
  TIDB_HOST?: string;
  TIDB_PORT?: number;
  TIDB_USER?: string;
  TIDB_PASSWORD?: string;
  TIDB_DATABASE?: string;
  TIDB_SSL?: boolean;

  // Supabase (Auth & Object Storage Bucket)
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_JWKS_URL?: string;
}

export function getEnv(): AppEnv {
  return {
    NODE_ENV: (process.env.NODE_ENV as AppEnv['NODE_ENV']) || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    DATABASE_URL: process.env.DATABASE_URL,
    TIDB_HOST: process.env.TIDB_HOST,
    TIDB_PORT: process.env.TIDB_PORT ? Number(process.env.TIDB_PORT) : 4000,
    TIDB_USER: process.env.TIDB_USER,
    TIDB_PASSWORD: process.env.TIDB_PASSWORD,
    TIDB_DATABASE: process.env.TIDB_DATABASE || 'sys',
    TIDB_SSL: process.env.TIDB_SSL !== 'false',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_JWKS_URL: process.env.SUPABASE_JWKS_URL,
  };
}

export function isDbConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.DATABASE_URL || (env.TIDB_HOST && env.TIDB_USER && env.TIDB_PASSWORD));
}

export function isSupabaseConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
