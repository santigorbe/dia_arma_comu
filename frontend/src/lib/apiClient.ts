export type ApiError = Error & { status?: number; body?: unknown };
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  const body = response.headers.get('content-type')?.includes('application/json') ? await response.json() : undefined;
  if (!response.ok) {
    const error = new Error(typeof body?.error === 'string' ? body.error : 'request_failed') as ApiError;
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body as T;
}
