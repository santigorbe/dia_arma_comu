import type { Queryable } from '../../db/pool.js';

export type GreetingParticipant = {
  id: string;
  full_name: string;
  military_rank: string | null;
  phone: string;
  card_image_filename: string | null;
};

export async function listParticipantsWithPhone(db: Queryable): Promise<GreetingParticipant[]> {
  const result = await db.query(
    `SELECT id, full_name, military_rank, phone, card_image_filename
     FROM participants
     WHERE phone IS NOT NULL AND phone <> ''
     ORDER BY created_at ASC`
  );
  return result.rows as GreetingParticipant[];
}

export async function findParticipantById(db: Queryable, id: string): Promise<GreetingParticipant | undefined> {
  const result = await db.query(
    `SELECT id, full_name, military_rank, phone, card_image_filename FROM participants WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] as GreetingParticipant | undefined;
}

export async function setCardImage(db: Queryable, id: string, filename: string): Promise<void> {
  await db.query('UPDATE participants SET card_image_filename = $1, updated_at = now() WHERE id = $2', [filename, id]);
}
