export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatDurationLong(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h} Std. ${m} Min.`;
  if (h > 0) return `${h} Stunde${h !== 1 ? 'n' : ''}`;
  if (m > 0) return `${m} Minute${m !== 1 ? 'n' : ''}`;
  return `${seconds} Sekunden`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function hoursToSeconds(h) { return Math.round(h * 3600); }
export function secondsToHours(s) { return Math.round((s / 3600) * 10) / 10; }

export function progressPct(tracked, target) {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((tracked / target) * 100));
}
