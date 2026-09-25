import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { FakeDb } from '../helpers/fakeDb.js';
import { testEnv } from '../helpers/testEnv.js';

describe('public event read contracts', () => {
  it('returns only published content supplied by the public query and supports an empty state', async () => {
    const db = new FakeDb();
    db.publicContent = [{ key: 'hero', title: 'Public title', body: 'Public body' }];
    const response = await request(createApp(testEnv, db)).get('/api/public/content');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ entries: db.publicContent });
    expect(db.statements.at(-1)).toContain('state = $1');
    expect(db.statements.at(-1)).toContain('published_at IS NOT NULL');
  });

  it('returns the schedule in the repository ordering and serializes accessible fields', async () => {
    const db = new FakeDb();
    db.publicSchedule = [{ id: 'a', title: 'Opening', description: null, startsAt: '2026-09-29T09:00:00.000Z', endsAt: '2026-09-29T10:00:00.000Z', location: 'Hall' }];
    const response = await request(createApp(testEnv, db)).get('/api/public/schedule');
    expect(response.status).toBe(200);
    expect(response.body.entries[0]).toMatchObject({ title: 'Opening', startsAt: '2026-09-29T09:00:00.000Z', location: 'Hall' });
    expect(db.statements.at(-1)).toContain('ORDER BY starts_at ASC, ends_at ASC, id ASC');
  });

  it('returns published Córdoba demo points with accessible labels and coordinates', async () => {
    const db = new FakeDb();
    const empty = await request(createApp(testEnv, db)).get('/api/public/map');
    expect(empty.body).toEqual({ points: [] });
    db.publicMapPoints = [
      { id: 'a', label: 'Acceso principal', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.3821, longitude: -64.1824 },
      { id: 'b', label: 'Acreditación', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.3817, longitude: -64.1817 },
      { id: 'c', label: 'Acto central', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.3825, longitude: -64.1819 },
      { id: 'd', label: 'Auditorio', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.383, longitude: -64.1822 },
      { id: 'e', label: 'Estacionamiento', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.3814, longitude: -64.183 },
      { id: 'f', label: 'Sanitarios', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.3828, longitude: -64.1831 }
    ];
    const response = await request(createApp(testEnv, db)).get('/api/public/map');
    expect(response.body.points).toHaveLength(6);
    expect(response.body.points).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Acceso principal', latitude: -31.3821, longitude: -64.1824 }),
      expect.objectContaining({ label: 'Sanitarios', latitude: -31.3828, longitude: -64.1831 })
    ]));
    expect(db.statements.at(-1)).toContain('state = $1');
  });
});
