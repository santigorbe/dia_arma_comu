import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type React from 'react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../main';
import { VisitProvider } from '../visits/VisitProvider';

const mapControls = vi.hoisted(() => ({ fitBounds: vi.fn(), setView: vi.fn() }));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="event-map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useMap: () => mapControls
}));

const cordobaDemoPoints = [
  { id: 'a', label: 'Acceso principal', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.3821, longitude: -64.1824 },
  { id: 'b', label: 'Acreditación', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.3817, longitude: -64.1817 },
  { id: 'c', label: 'Acto central', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.3825, longitude: -64.1819 },
  { id: 'd', label: 'Auditorio', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.383, longitude: -64.1822 },
  { id: 'e', label: 'Estacionamiento', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.3814, longitude: -64.183 },
  { id: 'f', label: 'Sanitarios', description: 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', latitude: -31.3828, longitude: -64.1831 }
];

const server = setupServer(
  http.post('/api/public/visits/init', () => HttpResponse.json({ visitId: '550e8400-e29b-41d4-a716-446655440000', replaced: false })),
  http.get('/api/public/content', () => HttpResponse.json({ entries: [{ key: 'hero', title: 'Evento publicado', body: 'Contenido del evento publicado' }] })),
  http.get('/api/public/schedule', () => HttpResponse.json({ entries: [] })),
  http.get('/api/public/map', () => HttpResponse.json({ points: cordobaDemoPoints }))
);

describe('Public event experience', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => { server.resetHandlers(); vi.restoreAllMocks(); mapControls.fitBounds.mockClear(); mapControls.setView.mockClear(); });
  afterAll(() => server.close());
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('communications_day_registration_dismissed', 'true');
    window.history.pushState({}, '', '/');
  });

  it('opens registration on first visit without a hash and persists dismissal across remounts', async () => {
    window.localStorage.removeItem('communications_day_registration_dismissed');
    const first = renderApp();
    expect(await screen.findByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /cerrar registro/i }));
    expect(window.localStorage.getItem('communications_day_registration_dismissed')).toBe('true');
    first.unmount();
    renderApp();
    await screen.findByText('Celebración del Día del Arma de Comunicaciones');
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('navigation', { name: 'Navegación móvil' }).querySelector('button')!);
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('can open, dismiss, and reopen when localStorage is unavailable', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('Storage unavailable'); });
    renderApp();
    expect(await screen.findByRole('dialog')).toBeTruthy();
    await waitFor(() => expect((screen.getByRole('button', { name: /enviar registro/i }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('navigation', { name: 'Navegación móvil' }).querySelector('button')!);
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('renders published home content and navigates to schedule and map routes', async () => {
    renderApp();
    expect(await screen.findByRole('heading', { name: 'Celebración del Día del Arma de Comunicaciones' })).toBeTruthy();
    const video = document.querySelector<HTMLVideoElement>('video.hero-video');
    expect(video?.getAttribute('poster')).toBe('/strikers.jpg');
    expect(video?.querySelector('source')?.getAttribute('src')).toBe('/Trailer Programa Nuestro Ejército - Asalto y Maniobra [dVQsrJ4X4Rw].mp4');
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.playsInline).toBe(true);
    expect(video?.getAttribute('aria-hidden')).toBe('true');
    expect(document.querySelector<HTMLImageElement>('img[src="/logo_ciber.png"]')?.alt).toMatch(/logo de ciberdefensa/i);
    expect(document.querySelector<HTMLElement>('.hero')?.getAttribute('style')).toMatch(/strikers\.jpg/);
    expect(screen.getByText('29 DE SEPTIEMBRE - 1944-2024')).toBeTruthy();
    expect(screen.getByText('y del Sistema de Computación de Datos')).toBeTruthy();
    expect(screen.getByText('GUARNICIÓN EJÉRCITO “CÓRDOBA”')).toBeTruthy();
    expect(screen.getByRole('link', { name: /VER CRONOGRAMA/i }).getAttribute('href')).toBe('/cronograma');
    expect(screen.getByRole('link', { name: /VER MAPA OPERATIVO/i }).getAttribute('href')).toBe('/mapa');
    expect(screen.getByText('Ejército Argentino')).toBeTruthy();
    expect(screen.getByText('COMUNICACIONES E INFORMÁTICA')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Logo de Ciberdefensa' })).toBeTruthy();
    const menu = screen.getByRole('button', { name: 'Abrir menú de navegación' });
    fireEvent.click(menu);
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getAllByRole('link', { name: 'Cronograma' })[0]);
    expect(await screen.findByRole('heading', { name: 'Cronograma' })).toBeTruthy();
    expect(screen.getByText(/Aún no se han publicado entradas/i)).toBeTruthy();
    expect(screen.queryByText(/Vista previa de ejemplo del cronograma/i)).toBeNull();
    fireEvent.click(screen.getAllByRole('link', { name: 'Mapa' })[0]);
    expect(await screen.findByTestId('event-map')).toBeTruthy();
    expect(screen.getAllByText(/Acceso principal/i)).toHaveLength(2);
  });

  it('lists the Córdoba demo points and focuses the map on their bounds', async () => {
    window.history.pushState({}, '', '/mapa');
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Ubicaciones ilustrativas' })).toBeTruthy();
    expect(screen.getAllByText(/Acceso principal/i)).toHaveLength(2);
    expect(screen.getAllByText(/Sanitarios/i)).toHaveLength(2);
    await waitFor(() => expect(mapControls.fitBounds).toHaveBeenCalledWith(
      cordobaDemoPoints.map(({ latitude, longitude }) => [latitude, longitude]),
      { padding: [24, 24], maxZoom: 16 }
    ));
  });

  it('gives all four bottom navigation controls a decorative icon before the visible label', async () => {
    renderApp();
    await screen.findByText('Celebración del Día del Arma de Comunicaciones');
    const navigation = screen.getByRole('navigation', { name: 'Navegación móvil' });
    const controls = navigation.querySelectorAll('a, button');
    expect(controls).toHaveLength(4);
    expect(within(navigation).getByRole('link', { name: 'Inicio' }).getAttribute('href')).toBe('/');
    expect(within(navigation).getByRole('link', { name: 'Cronograma' }).getAttribute('href')).toBe('/cronograma');
    expect(within(navigation).getByRole('link', { name: 'Mapa' }).getAttribute('href')).toBe('/mapa');
    for (const [index, label] of ['Inicio', 'Cronograma', 'Mapa', 'Registrarse'].entries()) {
      const control = within(navigation).getByRole(index === 3 ? 'button' : 'link', { name: label });
      expect(control.firstElementChild?.tagName.toLowerCase()).toBe('svg');
      expect(control.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
      expect(control.lastElementChild?.tagName).toBe('SPAN');
      expect(control.lastElementChild?.textContent).toBe(label);
    }
  });

  it('retries failed home content loading', async () => {
    let calls = 0;
    server.use(http.get('/api/public/content', () => {
      calls += 1;
      return calls === 1 ? HttpResponse.json({ error: 'unavailable' }, { status: 503 }) : HttpResponse.json({ entries: [{ key: 'hero', title: 'Evento recuperado', body: 'Contenido recuperado' }] });
    }));
    renderApp();
    expect((await screen.findByRole('alert')).textContent).toMatch(/el contenido publicado del evento no está disponible/i);
    fireEvent.click(screen.getByRole('button', { name: /reintentar carga del contenido/i }));
    expect(await screen.findByText('Contenido recuperado')).toBeTruthy();
  });

  it('retries failed schedule loading and renders populated schedule entries', async () => {
    let calls = 0;
    server.use(http.get('/api/public/schedule', () => {
      calls += 1;
      return calls === 1 ? HttpResponse.json({ error: 'unavailable' }, { status: 503 }) : HttpResponse.json({ entries: [{ id: 'schedule-1', title: 'Ceremonia de apertura', description: 'Discurso de bienvenida', startsAt: '2026-09-29T09:00:00.000Z', endsAt: '2026-09-29T10:00:00.000Z', location: 'Salón principal' }] });
    }));
    window.history.pushState({}, '', '/cronograma');
    renderApp();
    expect((await screen.findByRole('alert')).textContent).toMatch(/el cronograma no está disponible/i);
    fireEvent.click(screen.getByRole('button', { name: /reintentar carga del cronograma/i }));
    expect(await screen.findByRole('heading', { name: 'Ceremonia de apertura' })).toBeTruthy();
    expect(screen.getByText(/Ubicación: Salón principal/i)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Vista previa de ejemplo del cronograma' })).toBeNull();
  });

  it('retries failed map loading while retaining the textual location list', async () => {
    let calls = 0;
    server.use(http.get('/api/public/map', () => {
      calls += 1;
      return calls === 1 ? HttpResponse.json({ error: 'unavailable' }, { status: 503 }) : HttpResponse.json({ points: [{ id: 'b', label: 'Punto de reunión', description: 'Puerta norte', latitude: -34.61, longitude: -58.41 }] });
    }));
    window.history.pushState({}, '', '/mapa');
    renderApp();
    expect((await screen.findByRole('alert')).textContent).toMatch(/los puntos del mapa no están disponibles/i);
    fireEvent.click(screen.getByRole('button', { name: /reintentar carga de puntos del mapa/i }));
    expect(await screen.findByTestId('event-map')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Ubicaciones ilustrativas' })).toBeTruthy();
    expect(screen.getAllByText(/Punto de reunión/i)).toHaveLength(2);
    expect(screen.getAllByText(/Datos ilustrativos \/ no oficiales/i).length).toBeGreaterThan(0);
  });

  it('keeps illustrative previews out of real error states', async () => {
    server.use(http.get('/api/public/schedule', () => HttpResponse.json({ error: 'unavailable' }, { status: 503 })));
    window.history.pushState({}, '', '/cronograma');
    renderApp();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText(/Ilustrativo \/ no oficial/i)).toBeNull();
    expect(screen.queryByText(/Vista previa de ejemplo del cronograma/i)).toBeNull();
  });

  it('keeps illustrative previews out of real empty map states', async () => {
    server.use(http.get('/api/public/map', () => HttpResponse.json({ points: [] })));
    window.history.pushState({}, '', '/mapa');
    renderApp();
    expect(await screen.findByText(/Aún no se han publicado puntos en el mapa/i)).toBeTruthy();
    expect(screen.queryByText(/Ilustrativo \/ no oficial/i)).toBeNull();
    expect(screen.queryByText(/Vista previa de ejemplo de orientación/i)).toBeNull();
  });

  it('provides public navigation on the direct registration route', async () => {
    window.localStorage.removeItem('communications_day_registration_dismissed');
    window.history.pushState({}, '', '/register');
    renderApp();
    expect(await screen.findByRole('heading', { name: /regístrese para participar del evento/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Página principal del evento' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Navegación móvil' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('navigation', { name: 'Navegación móvil' }).querySelector('button')!);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText('Nombre completo'));
  });

  it('traps focus, closes with Escape or backdrop interaction, and restores the actual opener', async () => {
    renderApp();
    await screen.findByText('Celebración del Día del Arma de Comunicaciones');
    const opener = screen.getByRole('navigation', { name: 'Navegación móvil' }).querySelector<HTMLButtonElement>('button')!;
    fireEvent.click(opener);
    const dialog = await screen.findByRole('dialog', { name: /regístrese para participar del evento/i });
    const close = screen.getByRole('button', { name: /cerrar registro/i });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /enviar registro/i }));
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
