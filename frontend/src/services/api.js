import { auth } from './authUtils';

const BASE = import.meta.env.VITE_API_URL || '/api';

const handle = async (res) => {
  if (res.status === 401 || res.status === 403) {
    auth.clear();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  // Some endpoints return plain text
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
};

/* ── Auth ── */
export const authAPI = {
  register: (data) => fetch(`${BASE}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handle),
  login: (data) => fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handle),
};

/* ── Sessions ── */
export const sessionAPI = {
  create: (data) => fetch(`${BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth.headers() },
    body: JSON.stringify(data),
  }).then(handle),

  getAll:    () => fetch(`${BASE}/sessions`).then(r => r.ok ? r.json() : []),
  getActive: () => fetch(`${BASE}/sessions/active`).then(r => r.ok ? r.json() : []),

  getById: (id) => fetch(`${BASE}/sessions/${id}`, {
    headers: auth.headers(),
  }).then(r => r.ok ? r.json() : null),

  updateElements: (id, elements) => fetch(`${BASE}/sessions/${id}/elements`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.headers() },
    body: JSON.stringify({ elements }),
  }).then(r => r.ok ? r.json() : null),

  delete: (id) => fetch(`${BASE}/sessions/${id}`, {
    method: 'DELETE', headers: auth.headers(),
  }),

  getUsers: (id) => fetch(`${BASE}/sessions/${id}/users`, {
    headers: auth.headers(),
  }).then(r => r.ok ? r.json() : { count: 0, users: [] }),

  getAnalytics: () => fetch(`${BASE}/sessions/analytics`)
    .then(r => r.ok ? r.json() : { totalSessions: 0, activeSessions: 0, totalActiveUsers: 0 }),

  // toggle — sends { active: boolean } for backward compat, or { status: string } for new backend
  toggle: (id, activeOrStatus) => fetch(`${BASE}/sessions/${id}/toggle`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.headers() },
    body: JSON.stringify(
      typeof activeOrStatus === 'boolean'
        ? { active: activeOrStatus, status: activeOrStatus ? 'ACTIVE' : 'INACTIVE' }
        : { status: activeOrStatus }
    ),
  }).then(r => r.ok ? r.json() : null),

  // Join by shareCode (for URL-based invite flow)
  joinSession: (shareCode, userId) => fetch(`${BASE}/sessions/join?shareCode=${shareCode}&userId=${userId}`, {
    method: 'POST', headers: auth.headers(),
  }).then(r => r.ok ? r.json() : null),

  removeUser: (sessionId, userId) => fetch(`${BASE}/sessions/${sessionId}/remove-user?userId=${userId}`, {
    method: 'POST', headers: auth.headers(),
  }).then(r => r.ok),

  updateRole: (sessionId, userId, role) => fetch(`${BASE}/sessions/${sessionId}/role?userId=${userId}&role=${role}`, {
    method: 'PUT', headers: auth.headers(),
  }).then(r => r.ok),
};

/* ── Chat ── */
export const chatAPI = {
  getHistory: (sessionId) => fetch(`${BASE}/chat/${sessionId}`, {
    headers: auth.headers(),
  }).then(r => r.ok ? r.json() : []),
};