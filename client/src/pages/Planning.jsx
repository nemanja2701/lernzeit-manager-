import { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, CheckSquare } from 'lucide-react';
import { api } from '../utils/api.js';
import { formatDate } from '../utils/time.js';
import Modal from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';

function getMonthStr(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

function getMonthLabel(monthStr) {
  const [y, m] = monthStr.split('-');
  return new Date(y, m - 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

const MONTHS = Array.from({ length: 6 }, (_, i) => getMonthStr(i));

export default function Planning() {
  const [view, setView] = useState('month');
  const [currentMonth, setCurrentMonth] = useState(getMonthStr(0));
  const [entries, setEntries] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', planned_date: '', planned_hours: 1, goal_id: '' });
  const toast = useToast();

  const loadEntries = (month) => api.getPlan(month).then(setEntries);

  useEffect(() => {
    api.getGoals().then(g => setGoals(g.filter(x => x.status === 'active')));
    loadEntries(currentMonth);
  }, []);

  useEffect(() => { loadEntries(currentMonth); }, [currentMonth]);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.createPlanEntry({ ...form, planned_hours: Number(form.planned_hours), goal_id: form.goal_id || null });
      toast('Lerneinheit geplant', 'success');
      setShowModal(false); loadEntries(currentMonth);
    } catch { toast('Fehler', 'error'); }
  }

  async function toggleEntry(entry) {
    await api.updatePlanEntry(entry.id, { completed: !entry.completed });
    loadEntries(currentMonth);
  }

  async function deleteEntry(id) {
    await api.deletePlanEntry(id); loadEntries(currentMonth);
  }

  function shiftMonth(delta) {
    const d = new Date(currentMonth + '-01');
    d.setMonth(d.getMonth() + delta);
    setCurrentMonth(d.toISOString().slice(0, 7));
  }

  const grouped = entries.reduce((acc, e) => {
    const day = new Date(e.planned_date).getDate();
    const week = day <= 7 ? 'Woche 1' : day <= 14 ? 'Woche 2' : day <= 21 ? 'Woche 3' : 'Woche 4';
    if (!acc[week]) acc[week] = [];
    acc[week].push(e);
    return acc;
  }, {});

  const totalPlanned = entries.reduce((s, e) => s + e.planned_hours, 0);
  const totalDone = entries.filter(e => e.completed).reduce((s, e) => s + e.planned_hours, 0);

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">
            <span className="title-icon"><CalendarDays size={24} /></span> Lernplanung
          </h1>
          <p className="page-subtitle">Plane Lernzeiten und Aufgaben monatsweise.</p>
        </div>
        <div className="flex-gap">
          <button className={`btn btn-sm ${view === 'month' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('month')}>Monatsansicht</button>
          <button className={`btn btn-sm ${view === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('overview')}>6-Monats-Übersicht</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} style={{ gap: 6 }}>
            <Plus size={15} /> Planen
          </button>
        </div>
      </div>

      {view === 'month' ? (
        <>
          <div className="flex-between mb-24">
            <div className="flex-gap">
              <button className="btn-icon" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></button>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{getMonthLabel(currentMonth)}</span>
              <button className="btn-icon" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></button>
            </div>
            <div className="flex-gap" style={{ gap: 16 }}>
              <span className="text-sm text-muted">Geplant: <strong>{totalPlanned}h</strong></span>
              <span className="text-sm text-muted">Erledigt: <strong style={{ color: 'var(--accent2)' }}>{totalDone}h</strong></span>
              {totalPlanned > 0 && (
                <span className={`badge ${totalDone >= totalPlanned ? 'badge-green' : 'badge-blue'}`}>
                  {Math.round(totalDone / totalPlanned * 100)}%
                </span>
              )}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="empty-state">
              <CalendarDays size={40} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
              <p>Keine Einheiten für {getMonthLabel(currentMonth)} geplant.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowModal(true)}>Jetzt planen</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(grouped).map(([week, items]) => (
                <div key={week}>
                  <div className="section-title">{week}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(entry => (
                      <div key={entry.id} className={`checkbox-item ${entry.completed ? 'done' : ''}`}
                        onClick={() => toggleEntry(entry)}>
                        <input type="checkbox" checked={!!entry.completed} readOnly />
                        <div style={{ flex: 1 }}>
                          <span className={entry.completed ? 'done-text' : ''} style={{ fontWeight: 500 }}>
                            {entry.title}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>
                            {formatDate(entry.planned_date)} · {entry.planned_hours}h
                            {entry.goal_title ? ` · ${entry.goal_title}` : ''}
                          </div>
                        </div>
                        <button className="btn-icon" onClick={e => { e.stopPropagation(); deleteEntry(entry.id); }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="text-muted text-sm" style={{ marginBottom: 8 }}>Überblick über die nächsten 6 Monate</p>
          {MONTHS.map(month => (
            <MonthSummaryRow key={month} month={month} onClick={() => { setCurrentMonth(month); setView('month'); }} />
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Lerneinheit planen" onClose={() => setShowModal(false)}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Beschreibung *</label>
              <input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="z. B. Kapitel 3 lesen" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Datum *</label>
                <input className="form-input" type="date" required value={form.planned_date} onChange={e => setForm({...form, planned_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Geplante Stunden</label>
                <input className="form-input" type="number" min="0.5" step="0.5" value={form.planned_hours} onChange={e => setForm({...form, planned_hours: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Lernziel (optional)</label>
              <select className="form-select" value={form.goal_id} onChange={e => setForm({...form, goal_id: e.target.value})}>
                <option value="">(kein Ziel)</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Abbrechen</button>
              <button type="submit" className="btn btn-primary">Planen</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function MonthSummaryRow({ month, onClick }) {
  const [data, setData] = useState([]);
  useEffect(() => { api.getPlan(month).then(setData); }, [month]);
  const total = data.reduce((s, e) => s + e.planned_hours, 0);
  const done = data.filter(e => e.completed).reduce((s, e) => s + e.planned_hours, 0);
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  return (
    <div className="card card-sm" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="flex-between">
        <span style={{ fontWeight: 600 }}>{getMonthLabel(month)}</span>
        <div className="flex-gap">
          <span className="text-sm text-muted">{total}h geplant</span>
          <span className="badge badge-green">{done}h erledigt</span>
          <ChevronRight size={14} color="var(--text3)" />
        </div>
      </div>
      {total > 0 && (
        <div className="progress-bar" style={{ marginTop: 10 }}>
          <div className={`progress-fill ${pct >= 100 ? 'success' : ''}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
