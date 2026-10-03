import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Toasts from './Toasts';
import SOSButton from './SOSButton';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const toggle = () => {
    if (window.matchMedia('(max-width: 900px)').matches) setMobileOpen((v) => !v);
    else setCollapsed((v) => !v);
  };

  return (
    <div className="app">
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <Sidebar collapsed={collapsed} open={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <div className="main">
        <Topbar onToggleSidebar={toggle} />
        <main className="content"><Outlet /></main>
      </div>
      <Toasts />
      {!isAdmin && <SOSButton variant="fab" />}
    </div>
  );
}
