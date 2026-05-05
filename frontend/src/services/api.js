import { auth } from './authUtils';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const handleResponse = async (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),

  login: (data) => fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
};

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessionAPI = {
  create: (data) => fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth.headers() },
    body: JSON.stringify(data),
  }).then(handleResponse),

  // Public — landing page stats (no JWT needed)
  getAll: () => fetch(`${BASE_URL}/sessions`).then(r => r.ok ? r.json() : []),
  getActive: () => fetch(`${BASE_URL}/sessions/active`).then(r => r.ok ? r.json() : []),

  getById: (id) => fetch(`${BASE_URL}/sessions/${id}`, {
    headers: auth.headers(),
  }).then(r => r.ok ? r.json() : null),

  updateElements: (id, elementsJson) => fetch(`${BASE_URL}/sessions/${id}/elements`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.headers() },
    body: JSON.stringify({ elementsJson }),
  }).then(r => r.ok ? r.json() : null),

  delete: (id) => fetch(`${BASE_URL}/sessions/${id}`, {
    method: 'DELETE',
    headers: auth.headers(),
  }),

  getUsers: (id) => fetch(`${BASE_URL}/sessions/${id}/users`, {
    headers: auth.headers(),
  }).then(r => r.ok ? r.json() : { count: 0, users: [] }),

  // Public — no JWT needed
  getAnalytics: () => fetch(`${BASE_URL}/sessions/analytics`)
    .then(r => r.ok ? r.json() : { totalSessions: 0, activeSessions: 0, totalActiveUsers: 0 }),

  toggle: (id, active) => fetch(`${BASE_URL}/sessions/${id}/toggle`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.headers() },
    body: JSON.stringify({ active }),
  }).then(r => r.ok ? r.json() : null),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  getHistory: (sessionId) => fetch(`${BASE_URL}/chat/${sessionId}`, {
    headers: auth.headers(),
  }).then(r => r.ok ? r.json() : []),
};