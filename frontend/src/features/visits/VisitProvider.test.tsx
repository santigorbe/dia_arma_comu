import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { VisitProvider, useVisit, visitStorage } from './VisitProvider';

function Probe() {
  const visit = useVisit();
  return <output>{visit.status}:{visit.visitId}</output>;
}

describe('VisitProvider', () => {
  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes an anonymous visit and stores only the visit UUID', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ visitId: '550e8400-e29b-41d4-a716-446655440000', replaced: false }));
    render(<VisitProvider><Probe /></VisitProvider>);

    await waitFor(() => expect(screen.getByText('ready:550e8400-e29b-41d4-a716-446655440000')).toBeTruthy());
    expect(window.localStorage.getItem(visitStorage.key)).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(window.localStorage.length).toBe(1);
  });

  it('replaces a malformed stored ID through the backend response', async () => {
    window.localStorage.setItem(visitStorage.key, 'bad-id');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ visitId: '550e8400-e29b-41d4-a716-446655440001', replaced: true }));
    render(<VisitProvider><Probe /></VisitProvider>);

    await waitFor(() => expect(window.localStorage.getItem(visitStorage.key)).toBe('550e8400-e29b-41d4-a716-446655440001'));
  });

  it.each(['getItem', 'setItem'] as const)('keeps the visit usable when storage %s throws', async (method) => {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error('Storage denied'); });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ visitId: '550e8400-e29b-41d4-a716-446655440000', replaced: false }));
    render(<VisitProvider><Probe /></VisitProvider>);
    expect(await screen.findByText('ready:550e8400-e29b-41d4-a716-446655440000')).toBeTruthy();
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}
