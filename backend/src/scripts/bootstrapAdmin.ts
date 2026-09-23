import bcrypt from 'bcrypt';
import { loadEnv } from '../config/env.js';
import { closePool, createPool } from '../db/pool.js';

const env = loadEnv();
if (!env.ADMIN_BOOTSTRAP_IDENTIFIER || !env.ADMIN_BOOTSTRAP_PASSWORD) throw new Error('ADMIN_BOOTSTRAP_IDENTIFIER and ADMIN_BOOTSTRAP_PASSWORD must be explicitly set');
const pool = createPool(env);
try {
  const exists = await pool.query('SELECT id FROM admins LIMIT 1');
  if (exists.rowCount) throw new Error('Bootstrap refused: an administrator already exists');
  const passwordHash = await bcrypt.hash(env.ADMIN_BOOTSTRAP_PASSWORD, 12);
  await pool.query('INSERT INTO admins (identifier, password_hash) VALUES ($1, $2)', [env.ADMIN_BOOTSTRAP_IDENTIFIER, passwordHash]);
  console.log('Administrator bootstrap completed.');
} finally { await closePool(pool); }
