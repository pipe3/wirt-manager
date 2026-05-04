import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api/client';
import styles from './AdminLogin.module.css';

interface Props {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.auth.login(password);
      setToken(data.token);
      onLogin();
      navigate('/');
    } catch {
      setError('Ungültiges Passwort');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade">
      <div className={`card ${styles.wrapper}`}>
        <h1>Wirt Manager</h1>
        <p className={styles.subtitle}>Bitte Admin-Passwort eingeben</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
