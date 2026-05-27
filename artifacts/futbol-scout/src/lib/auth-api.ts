const BASE = "/api";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

export interface ManagedUser {
  id: number;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const authApi = {
  me: () => apiFetch<AuthUser>("/auth/me"),
  login: (username: string, password: string) =>
    apiFetch<AuthUser>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  listUsers: () => apiFetch<ManagedUser[]>("/users"),
  createUser: (data: { username: string; password: string; role: string }) =>
    apiFetch<ManagedUser>("/users", { method: "POST", body: JSON.stringify(data) }),
  toggleUser: (id: number, active: boolean) =>
    apiFetch<ManagedUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify({ active }) }),
  changePassword: (id: number, password: string) =>
    apiFetch<ManagedUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify({ password }) }),
  changeRole: (id: number, role: string) =>
    apiFetch<ManagedUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  deleteUser: (id: number) =>
    apiFetch<{ ok: boolean }>(`/users/${id}`, { method: "DELETE" }),
  transferPlayer: (playerId: number, targetUserId: number) =>
    apiFetch<{ id: number; nombre: string }>(`/players/${playerId}/transfer`, {
      method: "PATCH",
      body: JSON.stringify({ userId: targetUserId }),
    }),
};
