import { apiUrl } from './config';

type ApiOk<T> = T & { ok: true };
type ApiErr = { ok: false; error: string };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function api<T = any>(action: string, opts: {
  method?: 'GET' | 'POST';
  token?: string | null;
  body?: any;
  query?: Record<string, string | number | undefined>;
} = {}): Promise<ApiOk<T>> {
  const method = opts.method || (opts.body ? 'POST' : 'GET');
  let url = apiUrl(action);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined) continue;
      url += `&${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`;
    }
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (method === 'POST') headers['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify(opts.body || {}) : undefined,
    });
  } catch {
    throw new ApiError('You are offline. Messages will retry when the stars reconnect.', 0);
  }
  let data: any = {};
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok || data.ok === false) {
    throw new ApiError(data.error || `Campus error ${res.status}`, res.status);
  }
  return data as ApiOk<T>;
}

export type { ApiErr };
