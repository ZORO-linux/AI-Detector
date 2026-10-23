import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ensureUsersTable, getDb } from '@/lib/db';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  salt: string;
  hash: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface DbUserRow {
  id: string;
  email: string;
  name: string;
  salt: string;
  hash: string;
  created_at: string | Date;
}

export function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

function mapRowToUser(row: DbUserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    salt: row.salt,
    hash: row.hash,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function hashPassword(password: string, salt: Buffer): Promise<string> {
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return derived.toString('hex');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateCredentials(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Enter a valid email address.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (password.length > 200) return 'Password is too long.';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
}

export async function createUser(email: string, password: string, name: string): Promise<StoredUser> {
  await ensureUsersTable();
  const sql = getDb();
  const normalized = normalizeEmail(email);

  // Check if a user with this email already exists
  const existing = (await sql`
    SELECT id FROM users WHERE email = ${normalized} LIMIT 1
  `) as Array<{ id: string }>;

  if (existing.length > 0) {
    throw new Error('An account with this email already exists.');
  }

  const salt = randomBytes(16);
  const id = randomUUID();
  const hash = await hashPassword(password, salt);
  const userName = name.trim().slice(0, 60) || normalized.split('@')[0];
  const saltHex = salt.toString('hex');

  const rows = (await sql`
    INSERT INTO users (id, email, name, salt, hash, created_at)
    VALUES (${id}, ${normalized}, ${userName}, ${saltHex}, ${hash}, NOW())
    RETURNING id, email, name, salt, hash, created_at
  `) as unknown as DbUserRow[];

  return mapRowToUser(rows[0]);
}

export async function authenticate(email: string, password: string): Promise<StoredUser | null> {
  await ensureUsersTable();
  const sql = getDb();
  const normalized = normalizeEmail(email);

  const rows = (await sql`
    SELECT id, email, name, salt, hash, created_at
    FROM users
    WHERE email = ${normalized}
    LIMIT 1
  `) as unknown as DbUserRow[];

  const user = rows[0];

  // Always compute a hash to mitigate timing attacks against missing accounts
  const salt = Buffer.from(user?.salt ?? randomBytes(16).toString('hex'), 'hex');
  const computed = Buffer.from(await hashPassword(password, salt), 'hex');
  const expected = Buffer.from(user?.hash ?? computed.toString('hex'), 'hex');

  if (!user) return null;
  if (computed.length !== expected.length) return null;
  return timingSafeEqual(computed, expected) ? mapRowToUser(user) : null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  await ensureUsersTable();
  const sql = getDb();

  const rows = (await sql`
    SELECT id, email, name, salt, hash, created_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `) as unknown as DbUserRow[];

  return rows[0] ? mapRowToUser(rows[0]) : null;
}
