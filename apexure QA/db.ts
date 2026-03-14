import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
// Use a relative path to bypass any "@shared" alias issues in VS Code
import * as schema from './shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing! Check your .env file.");
}

/**
 * Supabase Connection Pool
 * The 'ssl' object is mandatory for Supabase to prevent "no pg_hba.conf entry" errors.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Supabase uses self-signed certificates for their connection pooler
    rejectUnauthorized: false
  },
  // Recommended for Supabase's transaction mode
  max: 10,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });
