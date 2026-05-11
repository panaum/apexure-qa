import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
// Use a relative path to bypass any "@shared" alias issues in VS Code
import * as schema from './shared/schema';

if (!process.env.DATABASE_URL) {
  // Log a warning instead of throwing at import time.
  // Throwing here kills the entire process before the server can serve static files.
  console.warn('[db] WARNING: DATABASE_URL is not set. Database features will be unavailable.');
}

/**
 * Supabase Connection Pool
 * The 'ssl' object is mandatory for Supabase to prevent "no pg_hba.conf entry" errors.
 */
export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        // Supabase uses self-signed certificates for their connection pooler
        rejectUnauthorized: false
      },
      // Recommended for Supabase's transaction mode
      max: 10,
      idleTimeoutMillis: 30000,
    })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;
