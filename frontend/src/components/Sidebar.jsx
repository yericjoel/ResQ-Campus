import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert, LayoutDashboard, Siren, FileWarning, PackageSearch, PhoneCall, Megaphone, ClipboardList,
  UserRound, LogOut, Users, BarChart3, Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STUDENT_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/sos', label: 'SOS', icon: Siren, sos: true },
  { to: '/report', label: 'Report Incident', icon: FileWarning },
  { to: '/lost-found', label: 'Lost & Found', icon: PackageSearch },
  { to: '/contacts', label: 'Emergency Contacts', icon: PhoneCall },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/my-reports', label: 'My Reports', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/sos', label: 'SOS Monitoring', icon: Siren, sos: true },
  { to: '/admin/incidents', label: 'Incidents', icon: FileWarning },
  { to: '/admin/lost-found', label: 'Lost & Found', icon: PackageSearch },
  { to: '/admin/contacts', label: 'Emergency Contacts', icon: PhoneCall },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export default function Sidebar({ collapsed, open, onNavigate }) {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const items = isAdmin ? ADMIN_NAV : STUDENT_NAV;

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-logo"><ShieldAlert size={22} /></div>
        <div className="brand-text">
          <strong>ResQ Campus</strong>
          <span>{isAdmin ? 'Security console' : 'Campus safety'}</span>
        </div>
      </div>
      <nav className="nav">
        {items.map(({ to, label, icon: Icon, end, sos }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} title={label}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${sos && !isActive ? 'sos-link' : ''}`}>
            <Icon size={19} /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="nav-item" onClick={signOut} title="Logout">
          <LogOut size={19} /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
