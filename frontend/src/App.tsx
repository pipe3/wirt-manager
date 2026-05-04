import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import Inventur from './components/Inventur';
import Stammdaten from './components/Stammdaten';
import GastView from './components/GastView';
import { syncQueue } from './utils/sync';
import { api, getToken, clearToken } from './api/client';

type AuthState = 'loading' | 'admin' | 'guest' | 'none';

function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    const isGuestUrl = new URLSearchParams(window.location.search).has('gast');
    if (isGuestUrl) {
      setAuthState('guest');
      return;
    }
    if (getToken()) {
      api.auth.verify()
        .then(() => setAuthState('admin'))
        .catch(() => {
          clearToken();
          setAuthState('none');
        });
    } else {
      setAuthState('none');
    }
  }, []);

  useEffect(() => {
    if (authState !== 'admin') return;
    syncQueue();
    const interval = setInterval(syncQueue, 30000);
    return () => clearInterval(interval);
  }, [authState]);

  if (authState === 'loading') return null;

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={
            authState === 'guest'
              ? <Navigate to="/gast" replace />
              : authState === 'admin'
                ? <Dashboard />
                : <Navigate to="/login" replace />
          } />
          <Route path="/gast" element={<GastView />} />
          <Route path="/login" element={
            authState === 'admin'
              ? <Navigate to="/" replace />
              : <AdminLogin onLogin={() => setAuthState('admin')} />
          } />
          <Route path="/inventur/:id" element={
            authState === 'admin' ? <Inventur /> : <Navigate to="/login" replace />
          } />
          <Route path="/stammdaten" element={
            authState === 'admin' ? <Stammdaten /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
