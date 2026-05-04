import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Calendar, Check } from 'lucide-react';
import type { Produkt, Charge } from '../types';
import { api } from '../api/client';
import { addToQueue } from '../utils/sync';
import styles from './Inventur.module.css';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2, CURRENT_YEAR + 3];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function Inventur() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const produktId = Number(id);

  const [produkt, setProdukt] = useState<Produkt | null>(null);
  const [chargen, setChargen] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const [showAddBatch, setShowAddBatch] = useState(false);
  const [newCount, setNewCount] = useState(1);
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selYear, setSelYear] = useState(CURRENT_YEAR);

  useEffect(() => {
    fetchData();
  }, [produktId]);

  const fetchData = async () => {
    try {
      const [ps, cs] = await Promise.all([api.produkte.list(), api.chargen.list()]);
      setProdukt(ps.find((p) => p.id === produktId) ?? null);
      setChargen(cs.filter((c) => c.produkt_id === produktId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (chargeId: number, diff: number, grund: string) => {
    const charge = chargen.find((c) => c.id === chargeId);
    if (!charge || charge.kaesten_anzahl + diff < 0) return;

    setBusy(chargeId);
    try {
      await api.inventur.post({ produkt_id: produktId, charge_id: chargeId, differenz: diff, grund, benutzerrolle: 'Admin' });
      await fetchData();
    } catch {
      addToQueue({ produkt_id: produktId, charge_id: chargeId, differenz: diff, grund, benutzerrolle: 'Admin' });
      setChargen((prev) =>
        prev.map((c) => c.id === chargeId ? { ...c, kaesten_anzahl: c.kaesten_anzahl + diff } : c)
      );
    } finally {
      setBusy(null);
    }
  };

  const handleAddBatch = async () => {
    try {
      await api.chargen.create({ produkt_id: produktId, kaesten_anzahl: newCount, mhd_monat: selMonth, mhd_jahr: selYear });
      setShowAddBatch(false);
      setNewCount(1);
      await fetchData();
    } catch {
      alert('Fehler beim Speichern');
    }
  };

  if (loading || !produkt) return <div className="container">Lade...</div>;

  return (
    <div className="container animate-fade">
      <button onClick={() => navigate('/')} className={styles.backButton}>
        <ArrowLeft size={20} /> Zurück
      </button>

      <div className={styles.productHeader}>
        <h1>{produkt.name}</h1>
        <p className={styles.productSubtitle}>{produkt.kategorie} · Inventur</p>
      </div>

      <div className={styles.chargeList}>
        {chargen.map((c) => (
          <div key={c.id} className={`card ${styles.chargeCard}`}>
            <div>
              <div className={styles.chargeDate}>
                <Calendar size={14} />
                MHD: {String(c.mhd_monat).padStart(2, '0')}/{c.mhd_jahr}
              </div>
              <div className={styles.chargeCount}>{c.kaesten_anzahl} Kästen</div>
            </div>
            <div className={styles.chargeActions}>
              <button
                className={`${styles.roundButton} ${styles.decrementButton}`}
                onClick={() => handleUpdate(c.id, -1, 'Entnahme')}
                disabled={busy === c.id || c.kaesten_anzahl <= 0}
              >
                <Minus size={20} />
              </button>
              <button
                className={`${styles.roundButton} ${styles.incrementButton}`}
                onClick={() => handleUpdate(c.id, 1, 'Korrektur')}
                disabled={busy === c.id}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!showAddBatch ? (
        <button className={`card ${styles.addBatchButton}`} onClick={() => setShowAddBatch(true)}>
          <Plus size={20} /> Neue Charge hinzufügen
        </button>
      ) : (
        <div className={`card animate-fade ${styles.batchForm}`}>
          <h2 className={styles.batchFormTitle}>Neue Charge</h2>

          <div>
            <label className={styles.fieldLabel}>MHD — Monat</label>
            <div className={styles.monthGrid}>
              {MONTHS.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelMonth(m)}
                  className={`${styles.selectorButton} ${selMonth === m ? styles.selectorButtonActive : ''}`}
                >
                  {String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
            <label className={styles.fieldLabel} style={{ marginTop: '12px', display: 'block' }}>MHD — Jahr</label>
            <div className={styles.yearGrid}>
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelYear(y)}
                  className={`${styles.selectorButton} ${selYear === y ? styles.selectorButtonActive : ''}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={styles.fieldLabel}>Anzahl Kästen</label>
            <div className={styles.countRow}>
              <button className={styles.countButton} onClick={() => setNewCount((n) => Math.max(1, n - 1))}>
                <Minus size={20} />
              </button>
              <span className={styles.countDisplay}>{newCount}</span>
              <button className={styles.countButton} onClick={() => setNewCount((n) => n + 1)}>
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className={styles.formActions}>
            <button className={styles.cancelButton} onClick={() => setShowAddBatch(false)}>
              Abbrechen
            </button>
            <button className={styles.saveButton} onClick={handleAddBatch}>
              <Check size={20} /> Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
