export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function notificationsAllowed() {
  return 'Notification' in window && Notification.permission === 'granted';
}

export function sendNotification(title, body) {
  if (notificationsAllowed()) {
    try {
      new Notification(title, { body, icon: '/favicon.svg' });
    } catch {
      // Safari wirft hier manchmal, obwohl die Berechtigung da ist. Ignorieren.
    }
  }
}

// Erste Version zählte nur einen Timer runter. Problem: der lief auch,
// während man aktiv getippt hat. Jetzt setzt jede Eingabe den Timer zurück.
let timer = null;
let thresholdMs = 30 * 60 * 1000;
let started = false;
let onAlert = null;

function fire() {
  sendNotification(
    'Lernzeit-Erinnerung',
    'Du warst eine Weile inaktiv. Magst du eine neue Lerneinheit starten?'
  );
  if (onAlert) onAlert();
}

function reset() {
  if (!started) return;
  clearTimeout(timer);
  timer = setTimeout(fire, thresholdMs);
}

const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

export function startInactivityWatcher(minutes = 30, alertCallback = null) {
  thresholdMs = minutes * 60 * 1000;
  onAlert = alertCallback;
  if (!started) {
    started = true;
    activityEvents.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
  }
  reset();
}

export function clearInactivityWatcher() {
  started = false;
  clearTimeout(timer);
  activityEvents.forEach(ev => window.removeEventListener(ev, reset));
}
