// ── Token & user info stored in localStorage ──────────────────────────────

const TOKEN_KEY = 'wb_token';
const USER_KEY  = 'wb_user';

export const auth = {
  /** Save token + user object returned by login/register */
  save(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /** Get the raw JWT string, or null */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /** Get the stored user object { userId, name, email }, or null */
  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /** True when a token exists (not necessarily valid — backend validates) */
  isLoggedIn() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /** Clear all auth data (logout) */
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /** Return the Authorization header value, ready to spread into fetch headers */
  headers() {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};