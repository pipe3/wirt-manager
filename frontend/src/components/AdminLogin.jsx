import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (data.success) {
        onLogin();
        navigate('/');
      } else {
        setError(data.message || 'Login fehlgeschlagen');
      }
    } catch (err) {
      setError('Verbindungsfehler zum Server');
    }
  };

  return (
    <div className="container animate-fade">
      <div className="card" style={{ marginTop: '20vh' }}>
        <h1>Wirt Manager</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Bitte Admin-Passwort eingeben</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="password" 
            placeholder="Passwort" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
          <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '12px' }}>
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
