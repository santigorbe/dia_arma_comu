import { useCallback, useEffect, useState } from 'react';

export type LoadState<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error' };

export type PublicDataResult<T> = { state: LoadState<T>; retry: () => void };

export function usePublicData<T>(load: () => Promise<T>): PublicDataResult<T> {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [requestVersion, setRequestVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load().then((data) => active && setState({ status: 'ready', data })).catch(() => active && setState({ status: 'error' }));
    return () => { active = false; };
  }, [load, requestVersion]);
  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);
  return { state, retry };
}
