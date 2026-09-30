import { loadEnv } from '../config/env.js';
import { initializeDatabase } from '../db/initialize.js';
import { closePool, createPool } from '../db/pool.js';

const env = loadEnv();
const pool = createPool(env);

try {
  const applied = await initializeDatabase(pool);
  console.log(`Database initialization completed; applied ${applied.length} migration(s).`);
} finally {
  await closePool(pool);
}
