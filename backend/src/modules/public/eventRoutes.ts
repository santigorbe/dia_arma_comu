import { Router } from 'express';
import type { Queryable } from '../../db/pool.js';
import { readPublishedContent, readPublishedMapPoints, readPublishedSchedule } from './publicRepository.js';

export function createEventRoutes(db: Queryable): Router {
  const router = Router();
  router.get('/content', async (_request, response, next) => {
    try {
      response.json({ entries: await readPublishedContent(db) });
    } catch (error) {
      next(error);
    }
  });
  router.get('/schedule', async (_request, response, next) => {
    try {
      response.json({ entries: await readPublishedSchedule(db) });
    } catch (error) {
      next(error);
    }
  });
  router.get('/map', async (_request, response, next) => {
    try {
      response.json({ points: await readPublishedMapPoints(db) });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
