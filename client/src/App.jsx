import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Stopwatch from './pages/Stopwatch.jsx';
import Goals from './pages/Goals.jsx';
import Planning from './pages/Planning.jsx';
import Stats from './pages/Stats.jsx';
import Login from './pages/Login.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { requestNotificationPermission, startInactivityWatcher, clearInactivityWatcher } from './utils/notifications.js';

function AppInner() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!user) return;
    requestNotificationPermission();
    startInactivityWatcher(15);
    return () => clearInactivityWatcher();
  }, [user]);

  if (loading) {
    return <div className="flex-center" style={{ minHeight: '100vh', color: 'var(--text3)' }}>Laden …</div>;
  }

  if (!user) return <Login />;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stopwatch" element={<Stopwatch />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
