import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../main';
import { VisitProvider } from '../visits/VisitProvider';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="event-map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const server = setupServer(
  http.post('/api/public/visits/init', () => HttpResponse.json({ visitId: '550e8400-e29b-41d4-a716-446655440000', replaced: false })),
  http.get('/api/public/content', () => HttpResponse.json({ entries: [{ key: 'hero', title: 'Published event', body: 'Published event body' }] })),
  http.get('/api/public/schedule', () => HttpResponse.json({ entries: [] })),
  http.get('/api/public/map', () => HttpResponse.json({ points: [{ id: 'a', label: 'Accessible entrance', description: 'Step-free access', latitude: -34.6, longitude: -58.4 }] }))
);

describe('Public event experience', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(() => { window.localStorage.clear(); window.history.pushState({}, '', '/'); });

  it('renders published home content and navigates to schedule and map routes', async () => {
    renderApp();
    expect(await screen.findByRole('heading', { name: 'Published event' })).toBeTruthy();
    expect(screen.getByRole('note').textContent).toMatch(/background photograph supplied/i);
    expect(document.querySelector<HTMLImageElement>('img[src="/logo_ciber.png"]')?.alt).toMatch(/not the event logo/i);
    expect(document.querySelector<HTMLElement>('.hero')?.getAttribute('style')).toMatch(/strikers\.jpg/);
    const menu = screen.getByRole('button', { name: 'Menu' });
    fireEvent.click(menu);
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getAllByRole('link', { name: 'Schedule' })[0]);
    expect(await screen.findByRole('heading', { name: 'Schedule' })).toBeTruthy();
    expect(screen.getByText(/No schedule entries/i)).toBeTruthy();
    expect(screen.queryByText(/Example schedule preview/i)).toBeNull();
    fireEvent.click(screen.getAllByRole('link', { name: 'Map' })[0]);
    expect(await screen.findByTestId('event-map')).toBeTruthy();
    expect(screen.getAllByText(/Accessible entrance/i)).toHaveLength(2);
  });

  it('retries failed home content loading', async () => {
    let calls = 0;
    server.use(http.get('/api/public/content', () => {
      calls += 1;
      return calls === 1 ? HttpResponse.json({ error: 'unavailable' }, { status: 503 }) : HttpResponse.json({ entries: [{ key: 'hero', title: 'Recovered event', body: 'Recovered content' }] });
    }));
    renderApp();
    expect((await screen.findByRole('alert')).textContent).toMatch(/Published event content is currently unavailable/i);
    fireEvent.click(screen.getByRole('button', { name: /retry loading content/i }));
    expect(await screen.findByRole('heading', { name: 'Recovered event' })).toBeTruthy();
  });

  it('retries failed schedule loading and renders populated schedule entries', async () => {
    let calls = 0;
    server.use(http.get('/api/public/schedule', () => {
      calls += 1;
      return calls === 1 ? HttpResponse.json({ error: 'unavailable' }, { status: 503 }) : HttpResponse.json({ entries: [{ id: 'schedule-1', title: 'Opening ceremony', description: 'Welcome address', startsAt: '2026-09-29T09:00:00.000Z', endsAt: '2026-09-29T10:00:00.000Z', location: 'Main hall' }] });
    }));
    window.history.pushState({}, '', '/cronograma');
    renderApp();
    expect((await screen.findByRole('alert')).textContent).toMatch(/schedule is currently unavailable/i);
    fireEvent.click(screen.getByRole('button', { name: /retry loading schedule/i }));
    expect(await screen.findByRole('heading', { name: 'Opening ceremony' })).toBeTruthy();
    expect(screen.getByText(/Location: Main hall/i)).toBeTruthy();
    expect(screen.getByText(/Illustrative \/ not official/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Example schedule preview' })).toBeTruthy();
    expect(screen.getByText(/Example briefing session/i)).toBeTruthy();
  });

  it('retries failed map loading while retaining the textual location list', async () => {
    let calls = 0;
    server.use(http.get('/api/public/map', () => {
      calls += 1;
      return calls === 1 ? HttpResponse.json({ error: 'unavailable' }, { status: 503 }) : HttpResponse.json({ points: [{ id: 'b', label: 'Assembly point', description: 'North gate', latitude: -34.61, longitude: -58.41 }] });
    }));
    window.history.pushState({}, '', '/mapa');
    renderApp();
    expect((await screen.findByRole('alert')).textContent).toMatch(/Map points are currently unavailable/i);
    fireEvent.click(screen.getByRole('button', { name: /retry loading map points/i }));
    expect(await screen.findByTestId('event-map')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Locations' })).toBeTruthy();
    expect(screen.getAllByText(/Assembly point/i)).toHaveLength(2);
    expect(screen.getByRole('heading', { name: /example wayfinding preview/i })).toBeTruthy();
    expect(screen.getByText(/no coordinates or geographic map tiles/i)).toBeTruthy();
    expect(screen.getByText(/Example arrival point/i)).toBeTruthy();
  });

  it('keeps illustrative previews out of real error states', async () => {
    server.use(http.get('/api/public/schedule', () => HttpResponse.json({ error: 'unavailable' }, { status: 503 })));
    window.history.pushState({}, '', '/cronograma');
    renderApp();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText(/Illustrative \/ not official/i)).toBeNull();
    expect(screen.queryByText(/Example schedule preview/i)).toBeNull();
  });

  it('keeps illustrative previews out of real empty map states', async () => {
    server.use(http.get('/api/public/map', () => HttpResponse.json({ points: [] })));
    window.history.pushState({}, '', '/mapa');
    renderApp();
    expect(await screen.findByText(/No map points have been published yet/i)).toBeTruthy();
    expect(screen.queryByText(/Illustrative \/ not official/i)).toBeNull();
    expect(screen.queryByText(/Example wayfinding preview/i)).toBeNull();
  });

  it('provides public navigation on the direct registration route', async () => {
    window.history.pushState({}, '', '/register');
    renderApp();
    expect(await screen.findByRole('heading', { name: /register for event participation/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Event home' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeTruthy();
  });

  it('traps focus, closes with Escape or backdrop interaction, and restores the actual opener', async () => {
    renderApp();
    await screen.findByText('Published event');
    const opener = document.querySelector<HTMLButtonElement>('.cta-row button')!;
    fireEvent.click(opener);
    const dialog = await screen.findByRole('dialog', { name: /register for event participation/i });
    const close = screen.getByRole('button', { name: /close registration/i });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /submit registration/i }));
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    fireEvent.click(opener);
    fireEvent.mouseDown((await screen.findByRole('dialog')).parentElement!);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});

function renderApp() { return render(<VisitProvider><App /></VisitProvider>); }
