import crypto from 'node:crypto';
import { loadEnv } from '../config/env.js';
import { closePool, createPool } from '../db/pool.js';
import { processNextCommunicationJob } from '../modules/communications/communicationWorker.js';
import { createEmailProvider } from '../modules/communications/emailProvider.js';

const env = loadEnv();
const pool = createPool(env);
const provider = createEmailProvider(env);
const workerId = `communications-${crypto.randomUUID()}`;

async function run() {
  while (await processNextCommunicationJob(pool, provider, workerId)) {
    // Drain currently due work before the next polling interval.
  }
}

const interval = setInterval(() => void run(), 30_000);
void run();

async function shutdown() {
  clearInterval(interval);
  await closePool(pool);
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
