const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN ?? 'local-admin-token';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${ADMIN_TOKEN}`,
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}
