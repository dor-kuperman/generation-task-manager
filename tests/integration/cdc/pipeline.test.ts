import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

// This is the most valuable integration test:
// INSERT row in PG → verify CDC event was created by trigger

const TEST_DB_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

describe('CDC Pipeline Integration', () => {
  let pool: Pool;
  let userId: string;

  beforeAll(async () => {
    if (!TEST_DB_URL) {
      throw new Error('DATABASE_URL or DATABASE_URL_TEST required');
    }
    pool = new Pool({ connectionString: TEST_DB_URL });

    // Create a test user for task creation
    const { rows } = await pool.query(
      "INSERT INTO users (email, password, name) VALUES ($1, 'hash', 'CDC Tester') ON CONFLICT (email) DO UPDATE SET name = 'CDC Tester' RETURNING id",
      [`cdc-test-${Date.now()}@test.com`],
    );
    userId = rows[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates cdc_event on task INSERT', async () => {
    const { rows: taskRows } = await pool.query(
      "INSERT INTO tasks (title, created_by) VALUES ('CDC Test Task', $1) RETURNING id",
      [userId],
    );
    const taskId = taskRows[0].id;

    // Check that a CDC event was created by the trigger
    const { rows: events } = await pool.query(
      "SELECT * FROM cdc_events WHERE row_id = $1 AND operation = 'INSERT'",
      [taskId],
    );

    expect(events.length).toBe(1);
    expect(events[0].table_name).toBe('tasks');
    expect(events[0].row_data).toBeDefined();
    expect(events[0].row_data.title).toBe('CDC Test Task');
  });

  it('creates cdc_event on task UPDATE', async () => {
    const { rows: taskRows } = await pool.query(
      "INSERT INTO tasks (title, created_by) VALUES ('Update CDC Task', $1) RETURNING id",
      [userId],
    );
    const taskId = taskRows[0].id;

    await pool.query(
      "UPDATE tasks SET title = 'Updated CDC Task' WHERE id = $1",
      [taskId],
    );

    const { rows: events } = await pool.query(
      "SELECT * FROM cdc_events WHERE row_id = $1 AND operation = 'UPDATE'",
      [taskId],
    );

    expect(events.length).toBe(1);
    expect(events[0].row_data.title).toBe('Updated CDC Task');
    expect(events[0].old_data.title).toBe('Update CDC Task');
  });

  it('creates cdc_event on task DELETE', async () => {
    const { rows: taskRows } = await pool.query(
      "INSERT INTO tasks (title, created_by) VALUES ('Delete CDC Task', $1) RETURNING id",
      [userId],
    );
    const taskId = taskRows[0].id;

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    const { rows: events } = await pool.query(
      "SELECT * FROM cdc_events WHERE row_id = $1 AND operation = 'DELETE'",
      [taskId],
    );

    expect(events.length).toBe(1);
    expect(events[0].row_data).toBeNull();
    expect(events[0].old_data).toBeDefined();
  });
});
