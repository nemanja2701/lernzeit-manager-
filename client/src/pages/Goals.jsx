import { useState, useEffect } from 'react';
import { Target, Pencil, CheckCircle2, Trash2, Plus, Flag, Clock, ChevronRight } from 'lucide-react';
import { api } from '../utils/api.js';
import { formatDate, secondsToHours, progressPct } from '../utils/time.js';
import Modal from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';

const EMPTY_FORM = { title: '', description: '', target_hours: '', start_date: '', end_date: '' };

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detail, setDetail] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', due_date: '' });
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const load = () => api.getGoals().then(setGoals);
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY_FORM); setEditGoal(null); setShowModal(true); }
  function openEdit(g) {
    setForm({ title: g.title, description: g.description || '', target_hours: g.target_hours, start_date: g.start_date, end_date: g.end_date });
    setEditGoal(g); setShowModal(true);
  }

  async function submitForm(e) {
    e.preventDefault();
    try {
      if (editGoal) {
        await api.updateGoal(editGoal.id, { ...form, target_hours: Number(form.target_hours) });
        toast('Ziel aktualisiert', 'success');
      } else {
        await api.createGoal({ ...form, target_hours: Number(form.target_hours) });
        toast('Ziel erstellt', 'success');
      }
      setShowModal(false); load();
    } catch { toast('Fehler', 'error'); }
  }

  async function deleteGoal(id) {
    if (!confirm('Ziel wirklich löschen?')) return;
    await api.deleteGoal(id); toast('Ziel gelöscht', 'info'); load();
    if (detail?.id === id) setDetail(null);
  }

  async function markDone(g) {
    await api.updateGoal(g.id, { status: g.status === 'done' ? 'active' : 'done' }); load();
  }

  async function openDetail(g) { setDetail(await api.getGoal(g.id)); }

  async function addMilestone(e) {
    e.preventDefault();
    if (!milestoneForm.title || !milestoneForm.due_date) return;
    await api.createMilestone({ goal_id: detail.id, ...milestoneForm });
    setMilestoneForm({ title: '', due_date: '' });
    setDetail(await api.getGoal(detail.id));
    toast('Meilenstein hinzugefügt', 'success');
  }

  async function toggleMilestone(m) {
    await api.updateMilestone(m.id, { completed: !m.completed });
    setDetail(await api.getGoal(detail.id)); load();
  }

  async function deleteMilestone(id) {
    await api.deleteMilestone(id);
    setDetail(await api.getGoal(detail.id));
  }

  const filtered = goals.filter(g => filter === 'all' ? true : g.status === filter);

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">
            <span className="title-icon"><Target size={24} /></span> Lernziele
          </h1>
          <p className="page-subtitle">Plane deine Ziele für bis zu 6 Monate im Voraus.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} style={{ gap: 6 }}>
          <Plus size={16} /> Neues Ziel
        </button>
      </div>

      <div className="flex-gap mb-24" style={{ gap: 8 }}>
        {['all', 'active', 'done'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Alle' : f === 'active' ? 'Aktiv' : 'Abgeschlossen'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Target size={40} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
          <p>Noch keine Ziele. Lege dein erstes Lernziel an!</p>
        </div>
      ) : (
        <div className="grid-2-even">
          {filtered.map(g => {
            const pct = progressPct(g.tracked_seconds, g.target_hours * 3600);
            return (
              <div key={g.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openDetail(g)}>
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{g.title}</span>
                    <span className={`badge ${g.status === 'done' ? 'badge-green' : 'badge-blue'}`}>
                      {g.status === 'done' ? 'Fertig' : 'Aktiv'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button className="btn-icon" title="Bearbeiten" onClick={() => openEdit(g)}><Pencil size={14} /></button>
                    <button className="btn-icon" title={g.status === 'done' ? 'Reaktivieren' : 'Abschließen'} onClick={() => markDone(g)}>
                      <CheckCircle2 size={14} color={g.status === 'done' ? 'var(--accent2)' : undefined} />
                    </button>
                    <button className="btn-icon" title="Löschen" onClick={() => deleteGoal(g.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                {g.description && <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 10 }}>{g.description}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {formatDate(g.start_date)} – {formatDate(g.end_date)}
                  </span>
                  {g.milestone_count > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Flag size={12} /> {g.milestone_done}/{g.milestone_count}
                    </span>
                  )}
                </div>
                <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: 6 }}>
                  <span>{secondsToHours(g.tracked_seconds)}h von {g.target_hours}h</span>
                  <span style={{ fontWeight: 600, color: pct >= 100 ? 'var(--accent2)' : 'var(--text)' }}>{pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${pct >= 100 ? 'success' : ''}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editGoal ? 'Ziel bearbeiten' : 'Neues Lernziel'} onClose={() => setShowModal(false)}>
          <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Titel *</label>
              <input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="z. B. Mathematik Klausur bestehen" />
            </div>
            <div className="form-group">
              <label className="form-label">Beschreibung</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Was möchtest du erreichen?" />
            </div>
            <div className="form-group">
              <label className="form-label">Ziel-Lernstunden *</label>
              <input className="form-input" type="number" min="0" step="0.5" required value={form.target_hours} onChange={e => setForm({...form, target_hours: e.target.value})} placeholder="z. B. 40" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Startdatum *</label>
                <input className="form-input" type="date" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Enddatum *</label>
                <input className="form-input" type="date" required value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Abbrechen</button>
              <button type="submit" className="btn btn-primary">{editGoal ? 'Speichern' : 'Erstellen'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {detail && (
        <Modal title={detail.title} onClose={() => setDetail(null)} maxWidth={560}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
              {detail.description && <p style={{ marginBottom: 8 }}>{detail.description}</p>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} /> {formatDate(detail.start_date)} – {formatDate(detail.end_date)}
                &nbsp;·&nbsp; {secondsToHours(detail.tracked_seconds || 0)}h / {detail.target_hours}h Ziel
              </span>
            </div>
            <div className="divider" />
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flag size={15} /> Meilensteine
            </div>
            {detail.milestones?.length === 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Noch keine Meilensteine.</div>
            )}
            {detail.milestones?.map(m => (
              <div key={m.id} className={`checkbox-item ${m.completed ? 'done' : ''}`} onClick={() => toggleMilestone(m)}>
                <input type="checkbox" checked={!!m.completed} readOnly />
                <span className={m.completed ? 'done-text' : ''}>{m.title}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>bis {formatDate(m.due_date)}</span>
                <button className="btn-icon" style={{ marginLeft: 'auto' }}
                  onClick={e => { e.stopPropagation(); deleteMilestone(m.id); }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <form onSubmit={addMilestone} style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" style={{ flex: 2 }} placeholder="Neuer Meilenstein" value={milestoneForm.title}
                onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value})} />
              <input className="form-input" style={{ flex: 1 }} type="date" value={milestoneForm.due_date}
                onChange={e => setMilestoneForm({...milestoneForm, due_date: e.target.value})} />
              <button type="submit" className="btn btn-primary btn-sm" style={{ gap: 4 }}><Plus size={14} /></button>
            </form>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Schließen</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
