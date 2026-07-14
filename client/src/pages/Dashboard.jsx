import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timer, Target, CalendarDays, TrendingUp, Zap, Clock, BookOpen, BarChart2, ArrowRight, Flame } from 'lucide-react';
import { api } from '../utils/api.js';
import { formatDurationLong, secondsToHours, progressPct, formatDate } from '../utils/time.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getGoals()])
      .then(([s, g]) => { setStats(s); setGoals(g); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: 'var(--text3)' }}>Laden …</div>;

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'done').length;
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

  const statCards = [
    { icon: Clock, label: 'Heute', value: formatDurationLong(stats?.todaySeconds || 0), sub: 'Lernzeit erfasst' },
    { icon: TrendingUp, label: 'Diese Woche', value: formatDurationLong(stats?.weekSeconds || 0), sub: 'letzte 7 Tage' },
    { icon: BookOpen, label: 'Gesamt', value: `${secondsToHours(stats?.totalSeconds || 0)} h`, sub: 'alle Einheiten' },
    { icon: Target, label: 'Aktive Ziele', value: activeGoals.length, sub: `${completedGoals} abgeschlossen` },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{greeting}!</h1>
        <p className="page-subtitle">Dein Lernfortschritt auf einen Blick.</p>
      </div>

      <div className="grid-4 mb-24">
        {statCards.map(({ icon: Icon, label, value, sub }) => (
          <div className="stat-card" key={label}>
            <div className="stat-head">
              <span className="stat-icon"><Icon size={16} /></span>
              <span className="stat-label">{label}</span>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="flex-between mb-16">
            <h2 className="card-title"><Target size={18} color="var(--accent)" /> Aktive Lernziele</h2>
            <Link to="/goals" className="btn btn-secondary btn-sm">Alle <ArrowRight size={14} /></Link>
          </div>
          {activeGoals.length === 0 ? (
            <div className="empty-state">
              <Target size={38} />
              <p>Noch keine Ziele angelegt.</p>
              <Link to="/goals" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>Erstes Ziel erstellen</Link>
            </div>
          ) : (
            <div className="flex-col gap-16">
              {activeGoals.slice(0, 4).map(goal => {
                const pct = progressPct(goal.tracked_seconds, goal.target_hours * 3600);
                return (
                  <div key={goal.id}>
                    <div className="flex-between mb-8" style={{ marginBottom: 5 }}>
                      <span className="fw-600" style={{ fontSize: '0.92rem' }}>{goal.title}</span>
                      <span className="text-sm text-muted">{secondsToHours(goal.tracked_seconds)} / {goal.target_hours} h</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill ${pct >= 100 ? 'success' : pct > 60 ? '' : 'warn'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-faint" style={{ marginTop: 5 }}>{pct}% · bis {formatDate(goal.end_date)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-col gap-16">
          <div className="card">
            <h2 className="card-title mb-16"><Zap size={18} color="var(--accent)" /> Schnellstart</h2>
            <div className="flex-col gap-10">
              <Link to="/stopwatch" className="btn btn-primary w-full"><Timer size={16} /> Stoppuhr starten</Link>
              <Link to="/goals" className="btn btn-secondary w-full"><Target size={16} /> Neues Ziel anlegen</Link>
              <Link to="/planning" className="btn btn-secondary w-full"><CalendarDays size={16} /> Lerneinheit planen</Link>
            </div>
          </div>

          {stats?.byGoal?.length > 0 && (
            <div className="card">
              <h2 className="card-title mb-16"><Flame size={18} color="var(--amber)" /> Top-Ziele nach Zeit</h2>
              <div className="flex-col gap-10">
                {stats.byGoal.map((g, i) => (
                  <div key={i} className="flex-between text-sm">
                    <span className="fw-600">{g.title}</span>
                    <span className="badge badge-blue">{secondsToHours(g.seconds)} h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
