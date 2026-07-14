import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Save, Trash2, Timer, History, Plus, Clock } from 'lucide-react';
import { api } from '../utils/api.js';
import { formatDuration } from '../utils/time.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Stopwatch() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [note, setNote] = useState('');
  const [sessions, setSessions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualMin, setManualMin] = useState('');
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    api.getGoals().then(g => setGoals(g.filter(x => x.status === 'active'))).catch(() => {});
    refreshSessions();
    return () => { clearInterval(intervalRef.current); };
  }, []);

  function refreshSessions() {
    api.getSessions().then(setSessions).catch(() => {});
  }

  function start() {
    // Nicht einfach hochzählen: setInterval feuert nie exakt jede Sekunde,
    // die Uhr lief nach ein paar Minuten mehrere Sekunden nach.
    startTimeRef.current = Date.now() - elapsed * 1000;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);
    setIsRunning(true);
  }

  function pause() {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  }

  function reset() {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setElapsed(0);
    startTimeRef.current = null;
  }

  // Dauer kommt als Parameter rein, damit Stoppuhr und manuelle Eingabe
  // denselben Weg gehen.
  async function persistSession(durationSeconds) {
    if (!durationSeconds || durationSeconds < 1) {
      toast('Es wurde keine Zeit erfasst.', 'error');
      return false;
    }
    setSaving(true);
    try {
      const now = new Date();
      const startedAt = new Date(now.getTime() - durationSeconds * 1000).toISOString();
      await api.saveSession({
        // Number() ist wichtig: das select liefert einen String und das
        // Backend hat den stillschweigend verworfen. Hat uns Stunden gekostet.
        goal_id: selectedGoal ? Number(selectedGoal) : null,
        duration_seconds: durationSeconds,
        note: note.trim(),
        date: now.toISOString().split('T')[0],
        started_at: startedAt,
        ended_at: now.toISOString(),
      });
      toast('Lerneinheit gespeichert!', 'success');
      reset();
      setNote('');
      setManualMin('');
      setShowManual(false);
      refreshSessions();
        return true;
    } catch (e) {
      toast(`Speichern fehlgeschlagen: ${e.message}`, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }

  function saveStopwatch() {
    if (isRunning) pause();
    persistSession(elapsed);
  }

  function saveManual() {
    const seconds = Math.round(parseFloat(manualMin) * 60);
    persistSession(seconds);
  }

  async function removeSession(id) {
    try {
      await api.deleteSession(id);
      setSessions(prev => prev.filter(x => x.id !== id));
    } catch { toast('Löschen fehlgeschlagen', 'error'); }
  }

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const displayTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon"><Timer size={24} /></span> Stoppuhr
        </h1>
        <p className="page-subtitle">Erfasse ungestörte Lernzeit und ordne sie einem Ziel zu.</p>
      </div>

      <div className="grid-2 gap-16" style={{ alignItems: 'start' }}>
        <div className="flex-col gap-16">
          {/* Dark stopwatch card */}
          <div className={`stopwatch-card ${isRunning ? 'stopwatch-running' : ''}`}>
            <div className="stopwatch-display">{displayTime}</div>
            <div className="stopwatch-status">
              {isRunning
                ? <><span className="pulse-dot" /> Lernzeit läuft …</>
                : elapsed > 0 ? <><Pause size={14} /> Pausiert</> : <>Bereit zum Start</>}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', position: 'relative' }}>
              {!isRunning ? (
                <button className="btn btn-primary btn-lg" onClick={start}>
                  <Play size={18} /> {elapsed > 0 ? 'Weiter' : 'Start'}
                </button>
              ) : (
                <button className="btn btn-secondary btn-lg" onClick={pause}>
                  <Pause size={18} /> Pause
                </button>
              )}
              <button className="btn btn-secondary" onClick={reset} disabled={elapsed === 0 && !isRunning}>
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          </div>

          {/* Save panel */}
          <div className="save-panel">
            <div className="section-title"><Save size={16} color="var(--accent)" /> Einheit speichern</div>
            <div className="flex-col gap-12">
              <div className="form-group">
                <label className="form-label">Lernziel (optional)</label>
                <select className="form-select" value={selectedGoal} onChange={e => setSelectedGoal(e.target.value)}>
                  <option value="">(kein Ziel)</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notiz (optional)</label>
                <input className="form-input" placeholder="Was hast du gelernt?" value={note} onChange={e => setNote(e.target.value)} />
              </div>
              <button className="btn btn-success w-full" onClick={saveStopwatch} disabled={saving || elapsed < 1}>
                <Save size={16} /> {saving ? 'Speichert …' : `Gemessene Zeit speichern (${formatDuration(elapsed)})`}
              </button>

              <div className="divider" style={{ margin: '6px 0' }} />

              {!showManual ? (
                <button className="btn btn-secondary w-full" onClick={() => setShowManual(true)}>
                  <Plus size={15} /> Zeit manuell eintragen
                </button>
              ) : (
                <div className="flex-col gap-10" style={{ background: 'var(--surface2)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
                  <div className="form-group">
                    <label className="form-label">Dauer in Minuten</label>
                    <input className="form-input" type="number" min="1" step="1" placeholder="z. B. 45"
                      value={manualMin} onChange={e => setManualMin(e.target.value)} />
                  </div>
                  <div className="flex-gap">
                    <button className="btn btn-success" style={{ flex: 1 }} onClick={saveManual} disabled={saving || !manualMin}>
                      <Save size={15} /> Speichern
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setShowManual(false); setManualMin(''); }}>Abbrechen</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="card">
          <h2 className="card-title mb-16"><History size={18} color="var(--accent)" /> Letzte Einheiten</h2>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <Clock size={38} />
              <p>Noch keine Lerneinheiten gespeichert.</p>
            </div>
          ) : (
            <div className="flex-col gap-8">
              {sessions.slice(0, 16).map(sess => (
                <div key={sess.id} className="session-row">
                  <div>
                    <div className="fw-600">{formatDuration(sess.duration_seconds)}</div>
                    <div className="text-xs text-faint" style={{ marginTop: 2 }}>
                      {sess.goal_title ? `${sess.goal_title} · ` : ''}{sess.date}{sess.note ? ` · ${sess.note}` : ''}
                    </div>
                  </div>
                  <button className="btn-icon" onClick={() => removeSession(sess.id)} title="Löschen">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
