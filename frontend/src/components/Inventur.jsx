import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Calendar, Check } from 'lucide-react';
import { addToQueue } from '../utils/sync';

const Inventur = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produkt, setProdukt] = useState(null);
  const [chargen, setChargen] = useState([]);
  const [loading, setLoading] = useState(true);

  // Neuer Chargen-State
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [newCount, setNewCount] = useState(1);
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selYear, setSelYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/produkte'),
        fetch('/api/chargen')
      ]);
      const ps = await pRes.json();
      const cs = await cRes.json();
      setProdukt(ps.find(p => p.id == id));
      setChargen(cs.filter(c => c.produkt_id == id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (chargeId, diff, grund) => {
    try {
      const response = await fetch('/api/inventur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          produkt_id: id, 
          charge_id: chargeId, 
          differenz: diff, 
          grund,
          benutzerrolle: 'Admin'
        })
      });
      if (!response.ok) throw new Error('Offline');
      fetchData(); // Refresh
    } catch (err) {
      // Offline-Modus: In Queue speichern und UI optimistisch aktualisieren
      addToQueue({ 
        produkt_id: id, 
        charge_id: chargeId, 
        differenz: diff, 
        grund,
        benutzerrolle: 'Admin'
      });
      // Optimistisches Update im State
      setChargen(prev => prev.map(c => 
        c.id === chargeId ? { ...c, kaesten_anzahl: c.kaesten_anzahl + diff } : c
      ));
    }
  };

  const handleAddBatch = async () => {
    try {
      await fetch('/api/chargen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          produkt_id: id, 
          kaesten_anzahl: newCount, 
          mhd_monat: selMonth, 
          mhd_jahr: selYear 
        })
      });
      setShowAddBatch(false);
      fetchData();
    } catch (err) {
      alert('Fehler beim Speichern');
    }
  };

  if (loading || !produkt) return <div className="container">Lade...</div>;

  return (
    <div className="container animate-fade">
      <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', background: 'none', marginBottom: '1rem' }}>
        <ArrowLeft size={20} /> Zurück
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '4px' }}>{produkt.name}</h1>
        <p style={{ color: 'var(--text-dim)' }}>{produkt.kategorie} • Inventur</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '2rem' }}>
        {chargen.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                <Calendar size={14} /> MHD: {String(c.mhd_monat).padStart(2, '0')}/{c.mhd_jahr}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{c.kaesten_anzahl} Kästen</div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => handleUpdate(c.id, -1, 'Entnahme')}
                style={{ background: 'var(--danger)', color: 'white', width: '44px', height: '44px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}
              >
                <Minus size={20} />
              </button>
              <button 
                onClick={() => handleUpdate(c.id, 1, 'Korrektur')}
                style={{ background: 'var(--success)', color: 'white', width: '44px', height: '44px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!showAddBatch ? (
        <button 
          onClick={() => setShowAddBatch(true)}
          style={{ width: '100%', background: 'var(--card-bg)', border: '1px dashed var(--border)', padding: '16px', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={20} /> Neue Charge hinzufügen
        </button>
      ) : (
        <div className="card animate-fade">
          <h2 style={{ fontSize: '1.1rem' }}>Neue Charge</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-dim)', display: 'block', marginBottom: '8px' }}>MHD auswählen (Monat/Jahr)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <button 
                  key={m}
                  onClick={() => setSelMonth(m)}
                  style={{ 
                    padding: '8px', 
                    fontSize: '0.875rem',
                    background: selMonth === m ? 'var(--primary)' : 'var(--bg)',
                    color: selMonth === m ? 'white' : 'var(--text)'
                  }}
                >
                  {String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[2026, 2027, 2028].map(y => (
                <button 
                  key={y}
                  onClick={() => setSelYear(y)}
                  style={{ 
                    padding: '8px', 
                    fontSize: '0.875rem',
                    background: selYear === y ? 'var(--primary)' : 'var(--bg)',
                    color: selYear === y ? 'white' : 'var(--text)'
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-dim)', display: 'block', marginBottom: '8px' }}>Anzahl Kästen</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setNewCount(Math.max(1, newCount-1))} style={{ padding: '12px', background: 'var(--bg)' }}><Minus size={20} /></button>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', flex: 1, textAlign: 'center' }}>{newCount}</span>
              <button onClick={() => setNewCount(newCount+1)} style={{ padding: '12px', background: 'var(--bg)' }}><Plus size={20} /></button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowAddBatch(false)} style={{ flex: 1, padding: '12px', background: 'var(--bg)' }}>Abbrechen</button>
            <button onClick={handleAddBatch} style={{ flex: 2, padding: '12px', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Check size={20} /> Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventur;
