import { createServer } from 'node:http';
import { loadEnv } from './config/env.js';
import { closePool, createPool } from './db/pool.js';
import { createApp } from './app.js';

const env = loadEnv();
const pool = createPool(env);
const server = createServer(createApp(env, pool));

server.listen(env.PORT, () => {
  console.log(`Backend listening on ${env.PORT}`);
});

async function shutdown(): Promise<void> {
  server.close(async () => {
    await closePool(pool);
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
