import React, { useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Stammdaten = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [kategorie, setKategorie] = useState('');
  const [meldebestand, setMeldebestand] = useState(5);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/produkte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, kategorie, meldebestand_kaesten: meldebestand })
      });
      if (response.ok) {
        setStatus('Getränk erfolgreich angelegt!');
        setName('');
        setKategorie('');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setStatus('Fehler beim Speichern');
    }
  };

  return (
    <div className="container animate-fade">
      <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', background: 'none', marginBottom: '1rem' }}>
        <ArrowLeft size={20} /> Zurück
      </button>
      
      <div className="card">
        <h1>Neues Getränk anlegen</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Name des Getränks</label>
            <input 
              type="text" 
              placeholder="z.B. Pils, Cola, Spezi..." 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Kategorie / Typ</label>
            <input 
              type="text" 
              placeholder="z.B. Bier, Softdrink..." 
              value={kategorie} 
              onChange={(e) => setKategorie(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Meldebestand (in Kästen)</label>
            <input 
              type="number" 
              value={meldebestand} 
              onChange={(e) => setMeldebestand(parseInt(e.target.value))} 
              required 
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Warnung erscheint, wenn dieser Bestand unterschritten wird.</p>
          </div>

          {status && <p style={{ color: status.includes('erfolgreich') ? 'var(--success)' : 'var(--danger)' }}>{status}</p>}

          <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            <Save size={20} /> Getränk Speichern
          </button>
        </form>
      </div>
    </div>
  );
};

export default Stammdaten;
