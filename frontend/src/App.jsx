// ⚠️  FILE LOCATION: src/App.jsx   (same level as main.jsx — NOT inside src/components/)
//     main.jsx does:  import App from './App'
//     If you place this in src/components/, that import breaks and you get
//     "GET is not supported" errors from failed module resolution fallbacks.

import { useState, useCallback } from 'react';
import { auth } from './services/authUtils';
import LoginPage      from './components/LoginPage';
import LandingPage    from './components/LandingPage';
import WhiteboardApp  from './components/WhiteboardApp';
import AdminDashboard from './components/AdminDashboard';

const USER_COLORS = ['#8b5cf6','#06b6d4','#ec4899','#10b981','#f59e0b','#ef4444','#6366f1','#14b8a6'];
const randomColor  = () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

function buildUser(authUser) {
  return {
    id:    authUser.userId,
    name:  authUser.name,
    email: authUser.email,
    color: randomColor(),
  };
}

export default function App() {
  // Restore session from localStorage on first load
  const [loggedInUser, setLoggedInUser] = useState(() => {
    if (auth.isLoggedIn()) {
      const stored = auth.getUser();
      return stored ? buildUser(stored) : null;
    }
    return null;
  });

  const [view,    setView]    = useState('landing');
  const [session, setSession] = useState(null);

  const handleAuthSuccess = useCallback((authUser) => {
    setLoggedInUser(buildUser(authUser));
    setView('landing');
  }, []);

  const handleJoinSession = useCallback((sessionData, displayName) => {
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

  return (
    <LandingPage
      currentUser={loggedInUser}
      onJoinSession={handleJoinSession}
      onGoAdmin={() => setView('admin')}
      onLogout={handleLogout}
    />
  );
}