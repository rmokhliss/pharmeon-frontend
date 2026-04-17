export type PortailUser = {
  id: number;
  nom: string;
  email: string;
  type: string;
  role: string;
  ville?: string;
  approved?: boolean;
};

export function getPortailUser(): PortailUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('portail_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getPortailToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('portail_token');
}

export function savePortailSession(token: string, user: PortailUser) {
  localStorage.setItem('portail_token', token);
  localStorage.setItem('portail_user', JSON.stringify(user));
}

export function clearPortailSession() {
  localStorage.removeItem('portail_token');
  localStorage.removeItem('portail_user');
}

export function isProUser(): boolean {
  return getPortailUser()?.role === 'PRO';
}

export function isClientPublic(): boolean {
  const u = getPortailUser();
  return u?.role === 'CLIENT_PUBLIC' || (u != null && !u.role);
}

export async function portailFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getPortailToken();
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
