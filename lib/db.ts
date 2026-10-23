import { neon } from '@neondatabase/serverless';

let sqlClient: ReturnType<typeof neon> | null = null;
let initPromise: Promise<void> | null = null;

export function getDb() {
  if (!sqlClient) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured in .env.local.');
    }
    sqlClient = neon(databaseUrl);
  }
  return sqlClient;
}

/**
 * Automatically ensures the users table exists in Neon PostgreSQL.
 */
export async function ensureUsersTable(): Promise<void> {
  if (!initPromise) {
    const sql = getDb();
    initPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          salt VARCHAR(64) NOT NULL,
          hash VARCHAR(256) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
