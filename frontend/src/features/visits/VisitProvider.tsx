import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';

const visitStorageKey = 'communications_day_visit_id';

type VisitState = {
  visitId: string | null;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  refresh: () => Promise<void>;
};

const VisitContext = createContext<VisitState | undefined>(undefined);

type VisitResponse = { visitId: string; replaced: boolean };

export function VisitProvider({ children }: { children: React.ReactNode }) {
  const [visitId, setVisitId] = useState<string | null>(null);
  const [status, setStatus] = useState<VisitState['status']>('loading');
  const [error, setError] = useState<string | null>(null);

  async function initialize() {
    setStatus('loading');
    setError(null);
    try {
      let stored = visitId ?? undefined;
      try {
        stored = window.localStorage.getItem(visitStorageKey) ?? stored;
      } catch {
        // Use the in-memory visit when browser persistence is unavailable.
      }
      const response = await apiRequest<VisitResponse>('/api/public/visits/init', {
        method: 'POST',
        body: JSON.stringify(stored ? { visitId: stored } : {})
      });
      try {
        window.localStorage.setItem(visitStorageKey, response.visitId);
      } catch {
        // A successful API response remains usable without persistence.
      }
      setVisitId(response.visitId);
      setStatus('ready');
    } catch {
      setStatus('error');
      setError('No se pudo inicializar la visita. Inténtelo de nuevo cuando haya conexión.');
    }
  }

  useEffect(() => {
    void initialize();
  }, []);

  const value = useMemo(() => ({ visitId, status, error, refresh: initialize }), [visitId, status, error]);
  return <VisitContext.Provider value={value}>{children}</VisitContext.Provider>;
}

export function useVisit() {
  const context = useContext(VisitContext);
  if (!context) {
    throw new Error('useVisit must be used within VisitProvider');
  }
  return context;
}

export const visitStorage = { key: visitStorageKey };
