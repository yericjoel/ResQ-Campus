import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SosProvider } from './context/SosContext';
import AppLayout from './components/AppLayout';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SOS from './pages/SOS';
import ReportIncident from './pages/ReportIncident';
import MyReports from './pages/MyReports';
import LostFound from './pages/LostFound';
import EmergencyContacts from './pages/EmergencyContacts';
import Notifications from './pages/Notifications';
import Announcements from './pages/Announcements';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminSos from './pages/AdminSos';
import AdminIncidents from './pages/AdminIncidents';
import AdminLostFound from './pages/AdminLostFound';
import AdminContacts from './pages/AdminContacts';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminUsers from './pages/AdminUsers';
import AdminReports from './pages/AdminReports';

const home = (user) => (user.role === 'ADMIN' || user.role === 'SECURITY' ? '/admin' : '/');

/** Signed-in users only. */
function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Loading ResQ Campus..." />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <NotificationProvider>
      <SosProvider>
        <AppLayout />
      </SosProvider>
    </NotificationProvider>
  );
}

/** Keeps students out of administrator pages (the API enforces this too). */
function RoleGate({ admin }) {
  const { user, isAdmin } = useAuth();
  if (admin !== isAdmin) return <Navigate to={home(user)} replace />;
  return <Outlet />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Loading ResQ Campus..." />;
  return user ? <Navigate to={home(user)} replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route element={<Protected />}>
        <Route element={<RoleGate admin={false} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sos" element={<SOS />} />
          <Route path="/report" element={<ReportIncident />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/my-reports/:id" element={<MyReports />} />
          <Route path="/lost-found" element={<LostFound />} />
          <Route path="/contacts" element={<EmergencyContacts />} />
          <Route path="/announcements" element={<Announcements />} />
        </Route>
        <Route element={<RoleGate admin />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/sos" element={<AdminSos />} />
          <Route path="/admin/incidents" element={<AdminIncidents />} />
          <Route path="/admin/lost-found" element={<AdminLostFound />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
