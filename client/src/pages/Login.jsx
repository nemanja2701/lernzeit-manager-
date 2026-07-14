import { useState } from 'react';
import { GraduationCap, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== password2) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(username, password);
      else await register(username, password);
    } catch (err) {
      setError(err.message || 'Es ist ein Fehler aufgetreten.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-badge" style={{ width: 44, height: 44 }}><GraduationCap size={24} /></span>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', lineHeight: 1 }}>Lernzeit-Manager</h1>
            <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 2 }}>
              {mode === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}
            </div>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
            Anmelden
          </button>
          <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
            Registrieren
          </button>
        </div>

        <form onSubmit={submit} className="flex-col gap-12" style={{ marginTop: 4 }}>
          <div className="form-group">
            <label className="form-label">Benutzername</label>
            <input className="form-input" value={username} autoFocus
              onChange={e => setUsername(e.target.value)} placeholder="z. B. nemanja" />
          </div>
          <div className="form-group">
            <label className="form-label">Passwort</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="mindestens 6 Zeichen" />
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Passwort wiederholen</label>
              <input className="form-input" type="password" value={password2}
                onChange={e => setPassword2(e.target.value)} placeholder="Passwort erneut eingeben" />
            </div>
          )}

          {error && (
            <div className="auth-error"><AlertCircle size={15} /> {error}</div>
          )}

          <button className="btn btn-primary w-full" type="submit" disabled={busy} style={{ marginTop: 4 }}>
            {mode === 'login' ? <><LogIn size={16} /> Anmelden</> : <><UserPlus size={16} /> Konto erstellen</>}
          </button>
        </form>

        <p className="text-xs text-faint" style={{ textAlign: 'center', marginTop: 18 }}>
          {mode === 'login' ? 'Noch kein Konto? ' : 'Schon registriert? '}
          <button className="auth-link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Jetzt registrieren' : 'Hier anmelden'}
          </button>
        </p>
      </div>
    </div>
  );
}
