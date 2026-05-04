import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import Inventur from './components/Inventur';
import Stammdaten from './components/Stammdaten';
import GastView from './components/GastView';
import { syncQueue } from './utils/sync';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Initialer Sync Versuch
    syncQueue();
    // Intervall Sync alle 30 Sekunden
    const interval = setInterval(syncQueue, 30000);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('gast')) {
      setIsGuest(true);
    }
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            isGuest ? <GastView /> : (isAdmin ? <Dashboard /> : <Navigate to="/login" />)
          } />
          <Route path="/login" element={<AdminLogin onLogin={() => setIsAdmin(true)} />} />
          <Route path="/inventur/:id" element={isAdmin ? <Inventur /> : <Navigate to="/login" />} />
          <Route path="/stammdaten" element={isAdmin ? <Stammdaten /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
