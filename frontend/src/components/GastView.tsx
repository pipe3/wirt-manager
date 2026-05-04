import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { Produkt, Charge } from '../types';
import { api } from '../api/client';
import styles from './GastView.module.css';

export default function GastView() {
  const [produkte, setProdukte] = useState<Produkt[]>([]);
  const [chargen, setChargen] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([api.produkte.list(), api.chargen.list()])
      .then(([ps, cs]) => { setProdukte(ps); setChargen(cs); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getGesamtbestand = (produktId: number) =>
    chargen
      .filter((c) => c.produkt_id === produktId)
      .reduce((sum, c) => sum + c.kaesten_anzahl, 0);

  const handleNachschub = async (produktId: number) => {
    try {
      await api.nachschub.create(produktId);
      setRequested((prev) => new Set(prev).add(produktId));
    } catch {
      alert('Fehler beim Senden der Anfrage');
    }
  };

  if (loading) return <div className="container">Lade...</div>;

  return (
    <div className="container animate-fade">
      <header className={styles.header}>
        <h1>Wirt Manager</h1>
        <p className={styles.subtitle}>Aktueller Getränkebestand</p>
      </header>

      <div className={styles.list}>
        {produkte.map((p) => {
          const bestand = getGesamtbestand(p.id);
          const isRequested = requested.has(p.id);

          return (
            <div key={p.id} className={`card ${styles.productCard}`}>
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{p.name}</h3>
                <p className={styles.productCategory}>{p.kategorie}</p>
              </div>
              <div className={styles.stockInfo}>
                <span className={styles.stockNumber}>{bestand}</span>
                <p className={styles.stockLabel}>Kästen</p>
              </div>
              {bestand <= p.meldebestand_kaesten && (
                <button
                  disabled={isRequested}
                  onClick={() => handleNachschub(p.id)}
                  className={styles.requestButton}
                >
                  <Send size={16} />
                  {isRequested ? 'Gesendet' : 'Nachschub'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <footer className={styles.footer}>
        <p>Gäste-Ansicht</p>
      </footer>
    </div>
  );
}
