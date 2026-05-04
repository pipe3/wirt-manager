import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, ChevronRight, PlusCircle, Settings, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [produkte, setProdukte] = useState([]);
  const [chargen, setChargen] = useState([]);
  const [anfragen, setAnfragen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, cRes, nRes] = await Promise.all([
        fetch('/api/produkte'),
        fetch('/api/chargen'),
        fetch('/api/nachschub')
      ]);
      setProdukte(await pRes.json());
      setChargen(await cRes.json());
      setAnfragen(await nRes.json());
    } catch (err) {
      console.error("Fehler beim Laden der Daten", err);
    } finally {
      setLoading(false);
    }
  };

  const getGesamtbestand = (produktId) => {
    return chargen
      .filter(c => c.produkt_id === produktId)
      .reduce((sum, c) => sum + c.kaesten_anzahl, 0);
  };

  const getMHDStatus = (produktId) => {
    const produktChargen = chargen.filter(c => c.produkt_id === produktId);
    if (produktChargen.length === 0) return 'none';
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let status = 'green';
    for (const c of produktChargen) {
      const diffMonths = (c.mhd_jahr - currentYear) * 12 + (c.mhd_monat - currentMonth);
      if (diffMonths < 0) return 'red';
      if (diffMonths === 0) status = 'red';
      else if (diffMonths < 1 && status !== 'red') status = 'yellow';
    }
    return status;
  };

  if (loading) return <div className="container">Lade...</div>;

  return (
    <div className="container animate-fade">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Wirt Manager</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => navigate('/stammdaten')}
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '8px', borderRadius: '50%' }}
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => navigate('/stammdaten')} // Oder separate Produkt-Anlage
            style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <PlusCircle size={20} /> Getränk
          </button>
        </div>
      </header>

      {anfragen.length > 0 && (
        <div className="card" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--warning)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell color="var(--warning)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>Offene Nachschub-Anfragen!</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {anfragen.map(a => a.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {produkte.map(p => {
          const bestand = getGesamtbestand(p.id);
          const mhdStatus = getMHDStatus(p.id);
          const zuWenig = bestand <= p.meldebestand_kaesten;

          return (
            <div 
              key={p.id} 
              className="card" 
              onClick={() => navigate(`/inventur/${p.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
            >
              <div style={{ 
                width: '12px', 
                height: '40px', 
                borderRadius: '6px', 
                background: mhdStatus === 'red' ? 'var(--danger)' : (mhdStatus === 'yellow' ? 'var(--warning)' : 'var(--success)') 
              }} />
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '2px' }}>{p.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>{p.kategorie}</p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  {zuWenig && <AlertTriangle size={16} color="var(--warning)" />}
                  <span style={{ fontWeight: '700', fontSize: '1.25rem' }}>{bestand}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Kästen</p>
              </div>
              
              <ChevronRight size={20} color="var(--text-dim)" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
