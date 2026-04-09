import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export async function runMigrations(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { rows: executed } = await pool.query('SELECT name FROM _migrations ORDER BY name');
  const executedNames = new Set(executed.map((r) => r.name));

  for (const file of files) {
    if (executedNames.has(file)) {
      console.log(`Skipping ${file} (already executed)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Executed migration: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Failed migration ${file}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('All migrations complete.');
}
