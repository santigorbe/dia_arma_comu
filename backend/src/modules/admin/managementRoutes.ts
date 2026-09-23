import { Router } from 'express';
import { z } from 'zod';
import type { Queryable } from '../../db/pool.js';
import { AppError } from '../../shared/http/errors.js';
import { audit, type AdminRequest } from './auth.js';

const version = z.object({ version: z.number().int().positive() });
const content = z.object({ contentKey: z.string().trim().min(1).max(100), title: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(20_000) });
const schedule = z.object({ title: z.string().trim().min(1).max(200), description: z.string().max(5_000).nullable().optional(), startsAt: z.string().datetime(), endsAt: z.string().datetime(), location: z.string().max(200).nullable().optional() }).refine((v) => new Date(v.endsAt) > new Date(v.startsAt), 'endsAt must be after startsAt');
const map = z.object({ label: z.string().trim().min(1).max(200), description: z.string().max(5_000).nullable().optional(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });
type Resource = { name: string; table: string; input: z.ZodTypeAny; columns: string[]; response: string };
const resources: Resource[] = [
  { name: 'content', table: 'event_content', input: content, columns: ['content_key', 'title', 'body'], response: 'entries' },
  { name: 'schedule', table: 'schedule_entries', input: schedule, columns: ['title', 'description', 'starts_at', 'ends_at', 'location'], response: 'entries' },
  { name: 'map', table: 'map_points', input: map, columns: ['label', 'description', 'latitude', 'longitude'], response: 'points' }
];
const camelColumns: Record<string, string[]> = { content: ['contentKey', 'title', 'body'], schedule: ['title', 'description', 'startsAt', 'endsAt', 'location'], map: ['label', 'description', 'latitude', 'longitude'] };

function row(resource: Resource, value: Record<string, unknown>) {
  const aliases = resource.name === 'content' ? 'content_key AS "contentKey"' : resource.name === 'schedule' ? 'starts_at AS "startsAt", ends_at AS "endsAt"' : 'latitude::float8 AS latitude, longitude::float8 AS longitude';
  return `id, ${aliases}, ${resource.name === 'content' ? 'title, body' : resource.name === 'schedule' ? 'title, description, location' : 'label, description'}, state, version, published_at AS "publishedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;
}

export function createManagementRoutes(db: Queryable): Router {
  const router = Router();
  for (const resource of resources) {
    const base = `/${resource.name}`;
    router.get(base, async (_req, res, next) => { try { const q = await db.query(`SELECT ${row(resource, {})} FROM ${resource.table} WHERE deleted_at IS NULL ORDER BY created_at DESC`); res.json({ [resource.response]: q.rows }); } catch (e) { next(e); } });
    router.post(base, async (req: AdminRequest, res, next) => {
      try { const input = resource.input.parse(req.body) as Record<string, unknown>; const values = camelColumns[resource.name].map((key) => input[key] ?? null); const q = await db.query(`INSERT INTO ${resource.table} (${resource.columns.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING ${row(resource, {})}`, values); await audit(db, req.admin!.sub, `admin.${resource.name}.create`, resource.name, String(q.rows[0].id), 'success'); res.status(201).json({ item: q.rows[0] }); } catch (e) { next(validationError(e)); }
    });
    router.put(`${base}/:id`, async (req: AdminRequest, res, next) => {
      try { const input = resource.input.parse(req.body) as Record<string, unknown>; const expectedVersion = version.parse(req.body).version; const values = camelColumns[resource.name].map((key) => input[key] ?? null); const sets = resource.columns.map((column, i) => `${column} = $${i + 1}`).join(', '); const q = await db.query(`UPDATE ${resource.table} SET ${sets}, version = version + 1, updated_at = now() WHERE id = $${values.length + 1} AND version = $${values.length + 2} AND deleted_at IS NULL RETURNING ${row(resource, {})}`, [...values, req.params.id, expectedVersion]); if (!q.rowCount) throw new AppError(409, 'version_conflict'); await audit(db, req.admin!.sub, `admin.${resource.name}.update`, resource.name, req.params.id, 'success'); res.json({ item: q.rows[0] }); } catch (e) { next(validationError(e)); }
    });
    router.post(`${base}/:id/:action(publish|unpublish)`, async (req: AdminRequest, res, next) => {
      try { const input = version.parse(req.body); const publish = req.params.action === 'publish'; const q = await db.query(`UPDATE ${resource.table} SET state = $1, published_at = ${publish ? 'now()' : 'NULL'}, version = version + 1, updated_at = now() WHERE id = $2 AND version = $3 AND deleted_at IS NULL RETURNING ${row(resource, {})}`, [publish ? 'published' : 'draft', req.params.id, input.version]); if (!q.rowCount) throw new AppError(409, 'version_conflict'); await audit(db, req.admin!.sub, `admin.${resource.name}.${req.params.action}`, resource.name, req.params.id, 'success'); res.json({ item: q.rows[0] }); } catch (e) { next(validationError(e)); }
    });
    router.delete(`${base}/:id`, async (req: AdminRequest, res, next) => { try { const input = version.parse(req.body); const q = await db.query(`UPDATE ${resource.table} SET deleted_at = now(), state = 'draft', version = version + 1, updated_at = now() WHERE id = $1 AND version = $2 AND deleted_at IS NULL RETURNING id`, [req.params.id, input.version]); if (!q.rowCount) throw new AppError(409, 'version_conflict'); await audit(db, req.admin!.sub, `admin.${resource.name}.delete`, resource.name, req.params.id, 'success'); res.status(204).end(); } catch (e) { next(validationError(e)); } });
  }
  router.get('/dashboard', async (_req, res, next) => { try { const q = await db.query(`SELECT (SELECT count(*)::int FROM event_content WHERE deleted_at IS NULL) AS content, (SELECT count(*)::int FROM schedule_entries WHERE deleted_at IS NULL) AS schedule, (SELECT count(*)::int FROM map_points WHERE deleted_at IS NULL) AS map`); res.json({ counts: q.rows[0] }); } catch (e) { next(e); } });
  return router;
}
function validationError(error: unknown) { return error instanceof z.ZodError ? new AppError(400, 'validation_failed', 'validation_failed', { fields: error.flatten().fieldErrors }) : error; }
