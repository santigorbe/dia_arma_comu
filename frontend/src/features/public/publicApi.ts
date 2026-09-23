import { apiRequest } from '../../lib/apiClient';

export type ContentEntry = { key: string; title: string; body: string };
export type ScheduleEntry = { id: string; title: string; description: string | null; startsAt: string; endsAt: string; location: string | null };
export type MapPoint = { id: string; label: string; description: string | null; latitude: number; longitude: number };

export const readContent = () => apiRequest<{ entries: ContentEntry[] }>('/api/public/content');
export const readSchedule = () => apiRequest<{ entries: ScheduleEntry[] }>('/api/public/schedule');
export const readMapPoints = () => apiRequest<{ points: MapPoint[] }>('/api/public/map');
