import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../main';
import { VisitProvider } from '../visits/VisitProvider';

const server = setupServer(
  http.post('/api/public/visits/init', () => HttpResponse.json({ visitId: '550e8400-e29b-41d4-a716-446655440000', replaced: false })),
  http.post('/api/public/registrations', () => HttpResponse.json({ participantId: 'participant-1' }, { status: 201 })),
  http.get('/api/public/content', () => HttpResponse.json({ entries: [{ key: 'hero', title: 'Evento publicado', body: 'Contenido del evento publicado' }] })),
  http.get('/api/public/schedule', () => HttpResponse.json({ entries: [] }))
);

describe('embedded registration modal', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => { server.resetHandlers(); vi.restoreAllMocks(); });
  afterAll(() => server.close());
  beforeEach(() => {
    window.localStorage.setItem('communications_day_registration_dismissed', 'true');
    window.history.pushState({}, '', '/');
    vi.stubGlobal('crypto', { randomUUID: () => '550e8400-e29b-41d4-a716-446655440099' });
  });

  it('closes, resets, and announces a successful registration', async () => {
    render(<VisitProvider><App /></VisitProvider>);
    await screen.findByText('Celebración del Día del Arma de Comunicaciones');
    const opener = screen.getByRole('navigation', { name: 'Navegación móvil' }).querySelector<HTMLButtonElement>('button')!;
    fireEvent.click(opener);
    await screen.findByRole('dialog');
    await waitFor(() => expect((screen.getByRole('button', { name: 'Registrarme' }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText(/Nombre completo/i), { target: { value: 'Participant Name' } });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), { target: { value: 'person@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect((await screen.findByRole('status')).textContent).toMatch(/recibirá la confirmación/i);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(opener);
    expect((await screen.findByLabelText(/Nombre completo/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Correo electrónico/i) as HTMLInputElement).value).toBe('');
  });
});
