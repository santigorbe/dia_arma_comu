import type { Queryable, TransactionalPool } from './pool.js';

export async function withinTransaction<T>(db: Queryable, operation: (transaction: Queryable) => Promise<T>): Promise<T> {
  const transaction = 'connect' in db ? await (db as TransactionalPool).connect() : db;
  await transaction.query('BEGIN');
  try {
    const result = await operation(transaction);
    await transaction.query('COMMIT');
    return result;
  } catch (error) {
    await transaction.query('ROLLBACK');
    throw error;
  } finally {
    if ('release' in transaction && typeof transaction.release === 'function') transaction.release();
  }
}
