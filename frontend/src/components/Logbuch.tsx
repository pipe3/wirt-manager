import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { LogbuchEintrag } from '../types';
import { api } from '../api/client';
import styles from './Logbuch.module.css';

function formatDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function Logbuch() {
  const navigate = useNavigate();
  const [eintraege, setEintraege] = useState<LogbuchEintrag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.logbuch.list()
      .then(setEintraege)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">Lade...</div>;

  return (
    <div className="container animate-fade">
      <button onClick={() => navigate('/einstellungen')} className={styles.backButton}>
        <ArrowLeft size={20} /> Zurück
      </button>

      <div className="card">
        <h2>Logbuch</h2>
        {eintraege.length === 0 ? (
          <p className={styles.empty}>Keine Einträge vorhanden.</p>
        ) : (
          <div className={styles.list}>
            {eintraege.map((e) => (
              <div key={e.id} className={styles.row}>
                <div className={styles.meta}>
                  <span className={styles.datum}>{formatDatum(e.zeitstempel)}</span>
                  <span className={styles.produkt}>{e.produkt_name ?? '—'}</span>
                </div>
                <div className={styles.right}>
                  <span className={`${styles.differenz} ${e.differenz > 0 ? styles.positiv : styles.negativ}`}>
                    {e.differenz > 0 ? '+' : ''}{e.differenz}
                  </span>
                  <span className={styles.grund}>{e.grund}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
