import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Send } from 'lucide-react';

const GastView = () => {
  const [produkte, setProdukte] = useState([]);
  const [chargen, setChargen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/produkte'),
        fetch('/api/chargen')
      ]);
      setProdukte(await pRes.json());
      setChargen(await cRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getGesamtbestand = (produktId) => {
    return chargen
      .filter(c => c.produkt_id === produktId)
      .reduce((sum, c) => sum + c.kaesten_anzahl, 0);
  };

  const handleNachschub = async (produktId) => {
    try {
      await fetch('/api/nachschub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produkt_id: produktId })
      });
      setRequested([...requested, produktId]);
    } catch (err) {
      alert('Fehler beim Senden der Anfrage');
    }
  };

  if (loading) return <div className="container">Lade...</div>;

  return (
    <div className="container animate-fade">
      <header style={{ marginBottom: '2rem' }}>
        <h1>Wirt Manager</h1>
        <p style={{ color: 'var(--text-dim)' }}>Aktueller Getränkebestand im Haus</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {produkte.map(p => {
          const bestand = getGesamtbestand(p.id);
          const isRequested = requested.includes(p.id);

          return (
            <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '2px' }}>{p.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>{p.kategorie}</p>
              </div>

              <div style={{ textAlign: 'right', minWidth: '80px' }}>
                <span style={{ fontWeight: '700', fontSize: '1.25rem' }}>{bestand}</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Kästen</p>
              </div>

              {bestand <= p.meldebestand_kaesten && (
                <button 
                  disabled={isRequested}
                  onClick={() => handleNachschub(p.id)}
                  style={{ 
                    padding: '8px', 
                    background: isRequested ? 'var(--bg)' : 'var(--warning)', 
                    color: isRequested ? 'var(--text-dim)' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Send size={16} /> {isRequested ? 'Gesendet' : 'Nachschub'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <footer style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
        <p>Gäste-Ansicht (Read-Only)</p>
      </footer>
    </div>
  );
};

export default GastView;
