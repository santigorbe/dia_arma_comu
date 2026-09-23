import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    await screen.findByText(/Submit registration/i);

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText(/Consent is required/i)).toBeTruthy();
    expect(registrationCalls).toBe(0);
  });

  it('submits valid data and shows success', async () => {
    server.use(http.post('/api/public/registrations', () => HttpResponse.json({ participantId: 'participant-1', status: 'registered', consentVersion: 'consent-local-placeholder' }, { status: 201 })));
    renderPage();
    await screen.findByRole('button', { name: /submit registration/i });
    fillForm(true);
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText(/Registration was accepted/i)).toBeTruthy();
  });

  it('recovers from stale consent responses with the active version', async () => {
    server.use(http.post('/api/public/registrations', () => HttpResponse.json({ error: 'stale_consent_version', activeConsentVersion: 'consent-2026-09' }, { status: 409 })));
    renderPage();
    await screen.findByRole('button', { name: /submit registration/i });
    fillForm(true);
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText(/Consent changed/i)).toBeTruthy();
    expect(screen.getByText(/Consent version consent-2026-09/i)).toBeTruthy();
  });
});

function renderPage() {
  render(<VisitProvider><RegisterPage /></VisitProvider>);
}

function fillForm(consent = false) {
  fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Participant Name' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'person@example.test' } });
  if (consent) {
    fireEvent.click(screen.getByLabelText(/affirmatively consent/i));
  }
}
