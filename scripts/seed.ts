import { Pool } from 'pg';
import bcrypt from 'bcrypt';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user1234', 12);

    const { rows: users } = await pool.query(
      `INSERT INTO users (email, password, name, role) VALUES
        ($1, $2, 'Admin User', 'admin'),
        ($3, $4, 'Regular User', 'user')
       ON CONFLICT (email) DO NOTHING
       RETURNING id, name, role`,
      [
        'admin@example.com', adminPassword,
        'user@example.com', userPassword,
      ],
    );

    if (users.length === 0) {
      console.log('Users already exist, fetching...');
      const { rows: existing } = await pool.query(
        "SELECT id, name, role FROM users WHERE email IN ('admin@example.com', 'user@example.com') ORDER BY role",
      );
      users.push(...existing);
    }

    const adminId = users.find((u) => u.role === 'admin')?.id;
    const userId = users.find((u) => u.role === 'user')?.id;

    if (!adminId || !userId) {
      throw new Error('Failed to create/find seed users');
    }

    console.log(`Admin: ${adminId}, User: ${userId}`);

    const tasks = [
      { title: 'Set up project infrastructure', description: 'Configure Docker, CI/CD, and development environment', status: 'done', priority: 'high', created_by: adminId, assignee_id: adminId, tags: ['infrastructure', 'devops'] },
      { title: 'Implement user authentication', description: 'JWT-based auth with bcrypt password hashing', status: 'done', priority: 'critical', created_by: adminId, assignee_id: userId, tags: ['auth', 'security'] },
      { title: 'Build task CRUD API', description: 'RESTful API endpoints for task management', status: 'in_progress', priority: 'high', created_by: adminId, assignee_id: userId, tags: ['api', 'backend'] },
      { title: 'Design dashboard UI', description: 'Create responsive dashboard with sidebar navigation', status: 'in_progress', priority: 'medium', created_by: userId, assignee_id: userId, tags: ['frontend', 'ui'] },
      { title: 'Set up CDC pipeline', description: 'PostgreSQL triggers + LISTEN/NOTIFY to Elasticsearch', status: 'todo', priority: 'high', created_by: adminId, tags: ['cdc', 'elasticsearch'] },
      { title: 'Implement full-text search', description: 'Elasticsearch-powered search with fuzzy matching and highlighting', status: 'todo', priority: 'medium', created_by: adminId, tags: ['search', 'elasticsearch'] },
      { title: 'Add analytics dashboard', description: 'Charts and aggregations from Elasticsearch data', status: 'todo', priority: 'low', created_by: userId, tags: ['analytics', 'frontend'] },
      { title: 'Write unit tests', description: 'Vitest unit tests for core business logic', status: 'todo', priority: 'medium', created_by: adminId, assignee_id: userId, tags: ['testing'] },
      { title: 'Fix login redirect bug', description: 'Users not redirected to dashboard after login on mobile', status: 'todo', priority: 'critical', created_by: userId, tags: ['bug', 'auth'] },
      { title: 'Add SSE real-time updates', description: 'Server-Sent Events for live task and pipeline updates', status: 'todo', priority: 'medium', created_by: adminId, tags: ['sse', 'real-time'] },
    ];

    for (const task of tasks) {
      await pool.query(
        `INSERT INTO tasks (title, description, status, priority, created_by, assignee_id, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [task.title, task.description, task.status, task.priority, task.created_by, task.assignee_id ?? null, task.tags],
      );
    }

    console.log(`Seeded ${users.length} users and ${tasks.length} tasks.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
