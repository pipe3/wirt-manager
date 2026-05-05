import { useState, FormEvent } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import styles from './Stammdaten.module.css';

export default function Stammdaten() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [meldebestand, setMeldebestand] = useState(5);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.produkte.create({ name, meldebestand_kaesten: meldebestand });
      setStatus('Getränk erfolgreich angelegt!');
      setIsError(false);
      setName('');
      setTimeout(() => navigate('/'), 1500);
    } catch {
      setStatus('Fehler beim Speichern');
      setIsError(true);
    }
  };

  return (
    <div className="container animate-fade">
      <button onClick={() => navigate('/')} className={styles.backButton}>
        <ArrowLeft size={20} /> Zurück
      </button>

      <div className="card">
        <h1>Neues Getränk anlegen</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Name des Getränks</label>
            <input
              type="text"
              placeholder="z.B. Pils, Cola, Spezi..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Meldebestand (in Kästen)</label>
            <input
              type="number"
              min={0}
              value={meldebestand}
              onChange={(e) => setMeldebestand(Math.max(0, parseInt(e.target.value, 10) || 0))}
              required
            />
            <p className={styles.hint}>Warnung erscheint, wenn dieser Bestand unterschritten wird.</p>
          </div>

          {status && (
            <p className={`${styles.statusMessage} ${isError ? styles.statusError : styles.statusSuccess}`}>
              {status}
            </p>
          )}

          <button type="submit" className={styles.submitButton}>
            <Save size={20} /> Getränk speichern
          </button>
        </form>
      </div>
    </div>
  );
}
