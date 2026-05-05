import { useState, useCallback } from 'react';
import { auth } from './services/authUtils';
import LoginPage     from './components/LoginPage';
import LandingPage   from './components/LandingPage';
import WhiteboardApp from './components/WhiteboardApp';
import AdminDashboard from './components/AdminDashboard';

const USER_COLORS = ['#8b5cf6','#06b6d4','#ec4899','#10b981','#f59e0b','#ef4444','#6366f1','#14b8a6'];
const randomColor = () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

/**
 * Build a user object that WhiteboardApp / Sidebar need:
 *   { id, name, email, color }
 * Sourced from the auth store (set after login/register).
 */
function buildUser(authUser) {
  return {
    id:    authUser.userId,
    name:  authUser.name,
    email: authUser.email,
    color: randomColor(),
  };
}

export default function App() {
  // ── Auth state ───────────────────────────────────────────────────────────
  // Check localStorage on first render — if token exists, restore session
  const [loggedInUser, setLoggedInUser] = useState(() => {
    if (auth.isLoggedIn()) {
      const stored = auth.getUser();
      return stored ? buildUser(stored) : null;
    }
    return null;
  });

  // ── Routing state ────────────────────────────────────────────────────────
  const [view,    setView]    = useState('landing'); // landing | whiteboard | admin
  const [session, setSession] = useState(null);

  // Called by LoginPage after successful login/register
  const handleAuthSuccess = useCallback((authUser) => {
    setLoggedInUser(buildUser(authUser));
    setView('landing');
  }, []);

  // Called by LandingPage when user creates or joins a board
  const handleJoinSession = useCallback((sessionData, displayName) => {
    // Allow the user to override their display name from the join form
    if (displayName && displayName !== loggedInUser?.name) {
      setLoggedInUser(u => ({ ...u, name: displayName }));
    }
    setSession(sessionData);
    setView('whiteboard');
  }, [loggedInUser]);

  const handleLeaveSession = useCallback(() => {
    setSession(null);
    setView('landing');
  }, []);

  const handleLogout = useCallback(() => {
    auth.clear();
    setLoggedInUser(null);
    setSession(null);
    setView('landing');
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  // Not logged in → always show Login
  if (!loggedInUser) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (view === 'admin') {
    return <AdminDashboard onBack={() => setView('landing')} />;
  }

  if (view === 'whiteboard' && session) {
    return (
      <WhiteboardApp
        session={session}
        user={loggedInUser}
        onLeave={handleLeaveSession}
      />
    );
  }

  // Default: Landing page (user is authenticated)
  return (
    <LandingPage
      currentUser={loggedInUser}
      onJoinSession={handleJoinSession}
      onGoAdmin={() => setView('admin')}
      onLogout={handleLogout}
    />
  );
}