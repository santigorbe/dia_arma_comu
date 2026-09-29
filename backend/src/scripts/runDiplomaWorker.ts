import crypto from 'node:crypto';
import { loadEnv } from '../config/env.js';
import { closePool, createPool } from '../db/pool.js';
import { createEmailProvider } from '../modules/communications/emailProvider.js';
import { createDiplomaGenerator } from '../modules/diplomas/diplomaGenerator.js';
import { processNextDiplomaDelivery } from '../modules/diplomas/diplomaWorker.js';

const env = loadEnv();
const pool = createPool(env);
const provider = createEmailProvider(env);
const generator = createDiplomaGenerator();
const workerId = `diplomas-${crypto.randomUUID()}`;

async function run() {
  while (await processNextDiplomaDelivery(pool, provider, generator, workerId)) {
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
