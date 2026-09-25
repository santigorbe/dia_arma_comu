import { fireEvent, render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';
import { VisitProvider } from '../visits/VisitProvider';

const server = setupServer(
  http.post('/api/public/visits/init', () => HttpResponse.json({ visitId: '550e8400-e29b-41d4-a716-446655440000', replaced: false }))
);

describe('RegisterPage', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal('crypto', { randomUUID: () => '550e8400-e29b-41d4-a716-446655440099' });
  });

  it('requires affirmative consent before sending registration data', async () => {
    let registrationCalls = 0;
    server.use(http.post('/api/public/registrations', () => {
      registrationCalls += 1;
      return HttpResponse.json({ participantId: 'participant-1' }, { status: 201 });
    }));
    renderPage();
    await screen.findByText(/Enviar registro/i);

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /enviar registro/i }));

    expect(await screen.findByText(/El consentimiento es obligatorio/i)).toBeTruthy();
    expect(registrationCalls).toBe(0);
  });

  it('submits valid data and shows success', async () => {
    let payload: Record<string, unknown> | undefined;
    server.use(http.post('/api/public/registrations', async ({ request }) => {
      payload = await request.json() as Record<string, unknown>;
      return HttpResponse.json({ participantId: 'participant-1', status: 'registered', consentVersion: 'consent-local-placeholder' }, { status: 201 });
    }));
    renderPage();
    expect(screen.queryByLabelText(/Unidad u organización/i)).toBeNull();
    await screen.findByRole('button', { name: /enviar registro/i });
    fillForm(true);
    fireEvent.click(screen.getByRole('button', { name: /enviar registro/i }));

    expect(await screen.findByText(/El registro se aceptó/i)).toBeTruthy();
    expect(payload).not.toHaveProperty('unitOrOrganization');
    expect(payload).not.toHaveProperty('organization');
  });

  it('defaults to civil personnel and omits militaryRank', async () => {
    let payload: Record<string, unknown> | undefined;
    server.use(http.post('/api/public/registrations', async ({ request }) => {
      payload = await request.json() as Record<string, unknown>;
      return HttpResponse.json({ participantId: 'participant-1', status: 'registered', consentVersion: 'consent-local-placeholder' }, { status: 201 });
    }));
    renderPage();
    await screen.findByRole('button', { name: /enviar registro/i });
    expect(screen.queryByLabelText(/Grado/i)).toBeNull();
    fillForm(true);
    fireEvent.click(screen.getByRole('button', { name: /enviar registro/i }));

    expect(await screen.findByText(/El registro se aceptó/i)).toBeTruthy();
    expect(payload).toMatchObject({ personnelType: 'civil' });
    expect(payload).not.toHaveProperty('militaryRank');
  });

  it('reveals and sends the Grado field when personnel is militar', async () => {
    let payload: Record<string, unknown> | undefined;
    server.use(http.post('/api/public/registrations', async ({ request }) => {
      payload = await request.json() as Record<string, unknown>;
      return HttpResponse.json({ participantId: 'participant-1', status: 'registered', consentVersion: 'consent-local-placeholder' }, { status: 201 });
    }));
    renderPage();
    await screen.findByRole('button', { name: /enviar registro/i });
    fillForm(true);
    fireEvent.change(screen.getByLabelText(/Personal/i), { target: { value: 'militar' } });
    fireEvent.change(await screen.findByLabelText(/Grado/i), { target: { value: 'Coronel (CR)' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar registro/i }));

    expect(await screen.findByText(/El registro se aceptó/i)).toBeTruthy();
    expect(payload).toMatchObject({ personnelType: 'militar', militaryRank: 'Coronel (CR)' });
  });

  it('recovers from stale consent responses with the active version', async () => {
    server.use(http.post('/api/public/registrations', () => HttpResponse.json({ error: 'stale_consent_version', activeConsentVersion: 'consent-2026-09' }, { status: 409 })));
    renderPage();
    await screen.findByRole('button', { name: /enviar registro/i });
    fillForm(true);
    fireEvent.click(screen.getByRole('button', { name: /enviar registro/i }));

    expect(await screen.findByText(/El consentimiento cambió/i)).toBeTruthy();
    expect(screen.getByText(/Versión del consentimiento consent-2026-09/i)).toBeTruthy();
  });
});

function renderPage() {
  render(<VisitProvider><RegisterPage /></VisitProvider>);
}

function fillForm(consent = false) {
  fireEvent.change(screen.getByLabelText(/Nombre completo/i), { target: { value: 'Participant Name' } });
  fireEvent.change(screen.getByLabelText(/Correo electrónico/i), { target: { value: 'person@example.test' } });
  if (consent) {
    fireEvent.click(screen.getByLabelText(/Afirmo mi consentimiento/i));
  }
}
