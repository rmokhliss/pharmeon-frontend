export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export function saveAdminSession(token: string) {
  localStorage.setItem('admin_token', token);
}

export function clearAdminSession() {
  localStorage.removeItem('admin_token');
}

export async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erreur serveur'); }
  return res.json();
}
