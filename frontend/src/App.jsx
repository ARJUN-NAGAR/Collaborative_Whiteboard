import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider, useToast } from './components/ToastSystem';
import { auth } from './services/authUtils';
import { sessionAPI } from './services/api';

import LoginPage      from './components/LoginPage';
import LandingPage    from './components/LandingPage';
import WhiteboardApp  from './components/WhiteboardApp';
import AdminDashboard from './components/AdminDashboard';

const USER_COLORS = ['#8b5cf6','#06b6d4','#ec4899','#10b981','#f59e0b','#ef4444','#6366f1','#14b8a6'];
const randomColor  = () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

function buildUser(authUser) {
  return {
    id:    String(authUser.userId),
    name:  authUser.name,
    email: authUser.email,
    color: randomColor(),
  };
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [loggedInUser, setLoggedInUser] = useState(() => {
    if (auth.isLoggedIn()) {
      const stored = auth.getUser();
      return stored ? buildUser(stored) : null;
    }
    return null;
  });

  // Handle ?shareCode= from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shareCode = params.get('shareCode');
    
    if (shareCode) {
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (!loggedInUser) {
        sessionStorage.setItem('pendingShareCode', shareCode);
        toast.info('Please sign in to join the board');
        navigate('/login');
        return;
      }
      
      joinWithCode(shareCode, String(loggedInUser.id));
    }
  }, [location.search, loggedInUser, navigate, toast]);

  // Handle pending share code after login
  useEffect(() => {
    if (loggedInUser) {
      const pending = sessionStorage.getItem('pendingShareCode');
      if (pending) {
        sessionStorage.removeItem('pendingShareCode');
        joinWithCode(pending, String(loggedInUser.id));
      }
    }
  }, [loggedInUser]);

  const joinWithCode = async (code, userId) => {
    try {
      const sessionData = await sessionAPI.joinSession(code, userId);
      navigate(`/board/${sessionData.id}`, { state: { sessionData } });
    } catch (err) {
      toast.error('Failed to join session: ' + err.message);
    }
  };

  const handleLogout = useCallback(() => {
    auth.clear();
    setLoggedInUser(null);
    navigate('/');
  }, [navigate]);

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <LandingPage 
            currentUser={loggedInUser} 
            onLogout={handleLogout} 
          />
        } 
      />
      <Route 
        path="/login" 
        element={
          <LoginPage 
            onAuthSuccess={(u) => { 
              setLoggedInUser(buildUser(u)); 
              navigate('/'); 
            }} 
          />
        } 
      />
      <Route 
        path="/register" 
        element={
          <LoginPage 
            onAuthSuccess={(u) => { 
              setLoggedInUser(buildUser(u)); 
              navigate('/'); 
            }} 
          />
        } 
      />
      <Route 
        path="/dashboard" 
        element={loggedInUser ? <AdminDashboard /> : <LoginPage />} 
      />
      <Route 
        path="/board/:id" 
        element={<BoardRoute loggedInUser={loggedInUser} />} 
      />
    </Routes>
  );
}

// Wrapper for WhiteboardApp to extract ID and Session
function BoardRoute({ loggedInUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [sessionData, setSessionData] = useState(location.state?.sessionData || null);

  useEffect(() => {
    if (!sessionData && loggedInUser) {
      sessionAPI.getAllSessions()
        .then(sessions => {
          const s = sessions.find(s => s.id === id);
          if (s) setSessionData(s);
          else navigate('/');
        })
        .catch(() => navigate('/'));
    }
  }, [id, sessionData, loggedInUser, navigate]);

  if (!loggedInUser) {
    return <LoginPage onAuthSuccess={() => {}} />;
  }

  if (!sessionData) return null;

  return (
    <WhiteboardApp 
      session={sessionData} 
      user={loggedInUser} 
      onLeave={() => navigate('/')} 
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <MainApp />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}