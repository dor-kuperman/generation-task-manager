import { Pool } from 'pg';

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ...(process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL !== 'false' && {
        ssl: { rejectUnauthorized: true },
      }),
    });

    pool.on('error', (err) => {
      console.error('Unexpected PG pool error:', err);
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
