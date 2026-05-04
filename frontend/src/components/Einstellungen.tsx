import { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft, Trash2, Pencil, Check, X, Plus, ScrollText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Produkt } from '../types';
import { api } from '../api/client';
import styles from './Einstellungen.module.css';

export default function Einstellungen() {
  const navigate = useNavigate();
  const [produkte, setProdukte] = useState<Produkt[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMeldebestand, setEditMeldebestand] = useState(0);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMeldebestand, setNewMeldebestand] = useState(5);
  const [newStatus, setNewStatus] = useState('');
  const [newError, setNewError] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState('');
  const [pwError, setPwError] = useState(false);

  useEffect(() => { loadProdukte(); }, []);

  const loadProdukte = async () => {
    try {
      setProdukte(await api.produkte.list());
    } catch {
      // noop
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Getränk wirklich löschen?')) return;
    await api.produkte.delete(id);
    await loadProdukte();
  };

  const startEdit = (p: Produkt) => {
    setEditingId(p.id);
    setEditMeldebestand(p.meldebestand_kaesten);
  };

  const saveEdit = async (id: number) => {
    await api.produkte.updateMeldebestand(id, editMeldebestand);
    setEditingId(null);
    await loadProdukte();
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.produkte.create({ name: newName, meldebestand_kaesten: newMeldebestand });
      setNewName('');
      setNewMeldebestand(5);
      setShowNewForm(false);
      setNewStatus('');
      await loadProdukte();
    } catch {
      setNewStatus('Fehler beim Speichern');
      setNewError(true);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwStatus('Passwörter stimmen nicht überein');
      setPwError(true);
      return;
    }
    try {
      await api.auth.changePassword(oldPassword, newPassword);
      setPwStatus('Passwort erfolgreich geändert');
      setPwError(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwStatus('Aktuelles Passwort falsch');
      setPwError(true);
    }
  };

  return (
    <div className="container animate-fade">
      <button onClick={() => navigate('/')} className={styles.backButton}>
        <ArrowLeft size={20} /> Zurück
      </button>

      <div className="card">
        <h2>Getränke</h2>
        <div className={styles.drinkList}>
          {produkte.map((p) => (
            <div key={p.id} className={styles.drinkRow}>
              {editingId === p.id ? (
                <>
                  <span className={styles.drinkName}>{p.name}</span>
                  <div className={styles.editRow}>
                    <input
                      type="number"
                      min={0}
                      value={editMeldebestand}
                      onChange={(e) => setEditMeldebestand(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className={styles.meldebestandInput}
                    />
                    <span className={styles.editUnit}>Kästen</span>
                    <button onClick={() => saveEdit(p.id)} className={styles.iconBtn} title="Speichern">
                      <Check size={18} />
                    </button>
                    <button onClick={() => setEditingId(null)} className={styles.iconBtn} title="Abbrechen">
                      <X size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.drinkInfo}>
                    <span className={styles.drinkName}>{p.name}</span>
                    <span className={styles.drinkMeta}>Meldebestand: {p.meldebestand_kaesten} Kästen</span>
                  </div>
                  <div className={styles.drinkActions}>
                    <button onClick={() => startEdit(p)} className={styles.iconBtn} title="Meldebestand ändern">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Löschen">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {produkte.length === 0 && (
            <p className={styles.empty}>Noch keine Getränke angelegt.</p>
          )}
        </div>

        {!showNewForm ? (
          <button className={styles.addButton} onClick={() => setShowNewForm(true)}>
            <Plus size={18} /> Neues Getränk
          </button>
        ) : (
          <form onSubmit={handleCreate} className={styles.newForm}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                placeholder="z.B. Pils, Cola..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Meldebestand (Kästen)</label>
              <input
                type="number"
                min={0}
                value={newMeldebestand}
                onChange={(e) => setNewMeldebestand(Math.max(0, parseInt(e.target.value, 10) || 0))}
                required
              />
            </div>
            {newStatus && (
              <p className={`${styles.statusMessage} ${newError ? styles.statusError : styles.statusSuccess}`}>
                {newStatus}
              </p>
            )}
            <div className={styles.formActions}>
              <button type="button" onClick={() => setShowNewForm(false)} className={styles.cancelButton}>
                Abbrechen
              </button>
              <button type="submit" className={styles.saveButton}>
                <Check size={18} /> Speichern
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>Passwort ändern</h2>
        <form onSubmit={handlePasswordChange} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Aktuelles Passwort</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Neues Passwort</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Neues Passwort bestätigen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {pwStatus && (
            <p className={`${styles.statusMessage} ${pwError ? styles.statusError : styles.statusSuccess}`}>
              {pwStatus}
            </p>
          )}
          <button type="submit" className={styles.submitButton}>
            Passwort ändern
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <button className={styles.logbuchButton} onClick={() => navigate('/logbuch')}>
          <ScrollText size={18} /> Logbuch anzeigen
        </button>
      </div>
    </div>
  );
}
