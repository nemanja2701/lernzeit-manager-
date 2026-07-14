import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, PieChart, Target, Clock, BookOpen, Award } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { api } from '../utils/api.js';
import { formatDurationLong, secondsToHours, formatDateShort } from '../utils/time.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const chartDefaults = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 } } },
    y: { grid: { color: '#F0EEE9' }, ticks: { font: { family: 'DM Sans', size: 11 } }, min: 0 }
  }
};

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getGoals()])
      .then(([s, g]) => { setStats(s); setGoals(g); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: 'var(--text3)' }}>Laden…</div>;

  const last7 = buildLast7Days(stats?.last7Days || []);

  const weekChartData = {
    labels: last7.map(d => formatDateShort(d.date)),
    datasets: [{
      data: last7.map(d => Math.round(d.seconds / 3600 * 10) / 10),
      backgroundColor: '#EFF6FF',
      borderColor: '#2563EB',
      borderWidth: 2,
      borderRadius: 6,
    }]
  };

  const weekLineData = {
    labels: last7.map(d => formatDateShort(d.date)),
    datasets: [{
      data: last7.map((_, i) =>
        Math.round(last7.slice(0, i + 1).reduce((s, d) => s + d.seconds, 0) / 3600 * 10) / 10
      ),
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37,99,235,0.07)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#2563EB',
    }]
  };

  const goalDoughnut = stats?.byGoal?.length > 0 ? {
    labels: stats.byGoal.map(g => g.title),
    datasets: [{
      data: stats.byGoal.map(g => Math.round(g.seconds / 3600 * 10) / 10),
      backgroundColor: ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'],
      borderWidth: 0,
    }]
  } : null;

  const activeGoals = goals.filter(g => g.status === 'active');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon"><BarChart2 size={24} /></span> Statistiken
        </h1>
        <p className="page-subtitle">Visualisierung deiner Lernfortschritte.</p>
      </div>

      <div className="grid-4 mb-24">
        {[
          { icon: BookOpen, label: 'Gesamt', value: `${secondsToHours(stats?.totalSeconds || 0)}h`, sub: 'alle Lerneinheiten' },
          { icon: TrendingUp, label: 'Diese Woche', value: `${secondsToHours(stats?.weekSeconds || 0)}h`, sub: 'letzte 7 Tage' },
          { icon: Clock, label: 'Heute', value: formatDurationLong(stats?.todaySeconds || 0), sub: 'Lernzeit' },
          { icon: Award, label: 'Aktive Ziele', value: activeGoals.length, sub: `${goals.filter(g => g.status === 'done').length} abgeschlossen` },
        ].map(({ icon: Icon, label, value, sub }) => (
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

      <div className="grid-2-even mb-24">
        <div className="card">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <BarChart2 size={18} color="var(--accent)" /> Lernzeit letzte 7 Tage (h)
          </h2>
          <Bar data={weekChartData} options={chartDefaults} />
        </div>
        <div className="card">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <TrendingUp size={18} color="var(--accent)" /> Kumulierte Lernzeit (h)
          </h2>
          <Line data={weekLineData} options={chartDefaults} />
        </div>
      </div>

      <div className="grid-2-even">
        <div className="card">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <PieChart size={18} color="var(--accent)" /> Zeit pro Ziel
          </h2>
          {goalDoughnut ? (
            <div style={{ maxWidth: 280, margin: '0 auto' }}>
              <Doughnut data={goalDoughnut} options={{
                responsive: true,
                plugins: { legend: { display: true, position: 'bottom', labels: { font: { family: 'DM Sans', size: 11 }, padding: 16 } } }
              }} />
            </div>
          ) : (
            <div className="empty-state">
              <PieChart size={36} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
              <p>Noch keine Daten mit Ziel-Zuordnung.</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Target size={18} color="var(--accent)" /> Ziel-Fortschritt
          </h2>
          {activeGoals.length === 0 ? (
            <div className="empty-state">
              <Target size={36} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
              <p>Keine aktiven Ziele.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeGoals.map(g => {
                const pct = Math.min(100, Math.round((g.tracked_seconds / (g.target_hours * 3600)) * 100));
                return (
                  <div key={g.id}>
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.title}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
                        {secondsToHours(g.tracked_seconds)}h / {g.target_hours}h
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div className="progress-bar" style={{ flex: 1, marginTop: 0 }}>
                        <div className={`progress-fill ${pct >= 100 ? 'success' : pct > 60 ? '' : 'warn'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: 36, color: pct >= 100 ? 'var(--accent2)' : 'var(--text)' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildLast7Days(data) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return { date: dateStr, seconds: (data.find(x => x.date === dateStr) || {}).seconds || 0 };
  });
}
