import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Timer, Target, CalendarDays, BarChart2, GraduationCap, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/stopwatch', icon: Timer, label: 'Stoppuhr' },
  { path: '/goals', icon: Target, label: 'Lernziele' },
  { path: '/planning', icon: CalendarDays, label: 'Planung' },
  { path: '/stats', icon: BarChart2, label: 'Statistiken' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <span className="logo-badge"><GraduationCap size={19} /></span>
          <div>
            <h1>Lernzeit</h1>
            <div className="sub">Manager</div>
          </div>
        </div>
      </div>
      <nav className="nav-section">
        <div className="nav-label">Navigation</div>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink key={path} to={path} end={path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><Icon size={18} /></span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-row">
          <span className="user-avatar"><User size={16} /></span>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-sub">angemeldet</div>
          </div>
        </div>
        <button className="nav-item logout-btn" onClick={logout}>
          <span className="nav-icon"><LogOut size={18} /></span>
          <span>Abmelden</span>
        </button>
      </div>
    </aside>
  );
}
