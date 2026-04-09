import { getPool } from '../pool';
import type { User, UserWithPassword, UserRole } from '../../types';

export async function findUserByEmail(email: string): Promise<UserWithPassword | null> {
  const { rows } = await getPool().query<UserWithPassword>(
    'SELECT id, email, password, name, role, created_at, updated_at FROM users WHERE email = $1',
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await getPool().query<User>(
    'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}

export async function createUser(
  email: string,
  hashedPassword: string,
  name: string,
  role: UserRole = 'user',
): Promise<User> {
  const { rows } = await getPool().query<User>(
    `INSERT INTO users (email, password, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, role, created_at, updated_at`,
    [email, hashedPassword, name, role],
  );
  return rows[0];
}

export async function emailExists(email: string): Promise<boolean> {
  const { rows } = await getPool().query(
    'SELECT 1 FROM users WHERE email = $1',
    [email],
  );
  return rows.length > 0;
}

export async function listUsers(): Promise<User[]> {
  const { rows } = await getPool().query<User>(
    'SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC',
  );
  return rows;
}

export async function updateUserRole(id: string, role: UserRole): Promise<User | null> {
  const { rows } = await getPool().query<User>(
    `UPDATE users SET role = $2 WHERE id = $1
     RETURNING id, email, name, role, created_at, updated_at`,
    [id, role],
  );
  return rows[0] ?? null;
}
