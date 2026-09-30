import type { Queryable } from '../../db/pool.js';

export type DiplomaCampaign = { id: string; state: string; audienceCount: number };

export async function createDiplomaCampaign(db: Queryable, adminId: string): Promise<DiplomaCampaign> {
  const campaign = await db.query(
    `INSERT INTO diploma_campaigns (created_by)
     VALUES ($1)
     RETURNING id, state, audience_count AS "audienceCount"`,
    [adminId]
  );
  const created = campaign.rows[0] as DiplomaCampaign;
  const deliveries = await db.query(
    `INSERT INTO diploma_deliveries (campaign_id, participant_id, recipient_email, participant_name, military_rank, diploma_grade)
      SELECT $1, id, email, full_name, COALESCE(NULLIF(btrim(military_rank), ''), 'NA'), 'Señor/a'
     FROM participants`,
    [created.id]
  );
  const audienceCount = deliveries.rowCount ?? 0;
  const state = audienceCount === 0 ? 'completed' : 'queued';
  await db.query(
    `UPDATE diploma_campaigns
     SET audience_count = $1, state = $2, completed_at = CASE WHEN $2 = 'completed' THEN now() ELSE NULL END
     WHERE id = $3`,
    [audienceCount, state, created.id]
  );
  return { ...created, state, audienceCount };
}
