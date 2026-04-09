import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

// These tests require a running PostgreSQL instance with migrations applied
const TEST_DB_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

describe('Database Queries', () => {
  let pool: Pool;

  beforeAll(async () => {
    if (!TEST_DB_URL) {
      throw new Error('DATABASE_URL or DATABASE_URL_TEST required for integration tests');
    }
    pool = new Pool({ connectionString: TEST_DB_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('can connect to PostgreSQL', async () => {
    const { rows } = await pool.query('SELECT 1 as connected');
    expect(rows[0].connected).toBe(1);
  });

  it('users table exists', async () => {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it('tasks table exists', async () => {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it('cdc_events table exists', async () => {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cdc_events')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it('rejects duplicate emails', async () => {
    const email = `unique-${Date.now()}@test.com`;
    await pool.query(
      "INSERT INTO users (email, password, name) VALUES ($1, 'hash', 'Test')",
      [email],
    );

    await expect(
      pool.query("INSERT INTO users (email, password, name) VALUES ($1, 'hash', 'Test2')", [email]),
    ).rejects.toThrow(/duplicate key/);
  });
});
