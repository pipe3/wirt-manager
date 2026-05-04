import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronRight, PlusCircle, Settings, Bell, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Produkt, Charge, NachschubAnfrage } from '../types';
import { api } from '../api/client';
import styles from './Dashboard.module.css';

type MhdStatus = 'green' | 'yellow' | 'red' | 'none';

const STATUS_COLORS: Record<MhdStatus, string> = {
  green: 'var(--success)',
  yellow: 'var(--warning)',
  red: 'var(--danger)',
  none: 'var(--border)',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [produkte, setProdukte] = useState<Produkt[]>([]);
  const [chargen, setChargen] = useState<Charge[]>([]);
  const [anfragen, setAnfragen] = useState<NachschubAnfrage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ps, cs, ns] = await Promise.all([
        api.produkte.list(),
        api.chargen.list(),
        api.nachschub.list(),
      ]);
      setProdukte(ps);
      setChargen(cs);
      setAnfragen(ns);
    } catch (err) {
      console.error('Fehler beim Laden der Daten', err);
    } finally {
      setLoading(false);
    }
  };

  const getGesamtbestand = (produktId: number) =>
    chargen
      .filter((c) => c.produkt_id === produktId)
      .reduce((sum, c) => sum + c.kaesten_anzahl, 0);

  const getMHDStatus = (produktId: number): MhdStatus => {
    const produktChargen = chargen.filter((c) => c.produkt_id === produktId);
    if (produktChargen.length === 0) return 'none';

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let status: MhdStatus = 'green';
    for (const c of produktChargen) {
      const diffMonths =
        (c.mhd_jahr - currentYear) * 12 + (c.mhd_monat - currentMonth);
      if (diffMonths < 0) return 'red';
      if (diffMonths === 0) status = 'red';
      else if (diffMonths <= 2 && status !== 'red') status = 'yellow';
    }
    return status;
  };

  if (loading) return <div className="container">Lade...</div>;

  return (
    <div className="container animate-fade">
      <header className={styles.header}>
        <h1>Wirt Manager</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.iconButton}
            onClick={() => navigate('/stammdaten')}
            title="Einstellungen"
          >
            <Settings size={20} />
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => navigate('/stammdaten')}
          >
            <PlusCircle size={20} /> Getränk
          </button>
        </div>
      </header>

      {anfragen.length > 0 && (
        <div className={`card ${styles.alert}`}>
          <Bell color="var(--warning)" />
          <div className={styles.alertBody}>
            <p className={styles.alertTitle}>Offene Nachschub-Anfragen!</p>
            <p className={styles.alertItems}>
              {anfragen.map((a) => a.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {produkte.map((p) => {
          const bestand = getGesamtbestand(p.id);
          const mhdStatus = getMHDStatus(p.id);
          const zuWenig = bestand <= p.meldebestand_kaesten;

          return (
            <div
              key={p.id}
              className={`card ${styles.productCard}`}
              onClick={() => navigate(`/inventur/${p.id}`)}
            >
              <div
                className={styles.statusBar}
                style={{ background: STATUS_COLORS[mhdStatus] }}
              />
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{p.name}</h3>
                <p className={styles.productCategory}>{p.kategorie}</p>
              </div>
              <div className={styles.stockInfo}>
                <div className={styles.stockCount}>
                  {zuWenig && <AlertTriangle size={16} color="var(--warning)" />}
                  <span className={styles.stockNumber}>{bestand}</span>
                </div>
                <p className={styles.stockLabel}>Kästen</p>
              </div>
              <ChevronRight size={20} color="var(--text-dim)" />
            </div>
          );
        })}
        {produkte.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
            <Package size={32} style={{ margin: '0 auto 1rem' }} />
            <p>Noch keine Getränke angelegt.</p>
          </div>
        )}
      </div>
    </div>
  );
}
