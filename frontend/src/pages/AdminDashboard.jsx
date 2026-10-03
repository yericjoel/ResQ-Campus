import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Siren, FileWarning, CalendarClock, PackageSearch, ShieldCheck, PhoneCall, Megaphone } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import useLiveSos from '../hooks/useLiveSos';
import { statsService } from '../services/statsService';
import { useRealtime } from '../context/NotificationContext';
import StatCard from '../components/StatCard';
import SosAlertCard from '../components/SosAlertCard';
import SosDetailsModal from '../components/SosDetailsModal';
import ActivityList from '../components/ActivityList';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const stats = useAsync(() => statsService.admin(), []);
  const activity = useAsync(() => statsService.activity(), []);
  const sos = useLiveSos(true);
  const [view, setView] = useState(null);

  const refresh = () => { stats.reload(); activity.reload(); };
  useRealtime('adminSos', refresh);
  useRealtime('incident', refresh);
  useRealtime('notification', refresh);

  const s = stats.data;
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head"><div><h1>Admin Dashboard</h1><p>Live overview of campus safety activity.</p></div></div>
      <ErrorAlert message={stats.error || sos.error || sos.actionError} onRetry={refresh} />
      {s ? (
        <div className="grid cols-4">
          <StatCard icon={Siren} tone="red" value={s.activeSos} label="Active SOS" />
          <StatCard icon={FileWarning} tone="amber" value={s.openIncidents} label="Open Incidents" />
          <StatCard icon={CalendarClock} tone="blue" value={s.incidentsToday} label="Incidents Today" />
          <StatCard icon={PackageSearch} tone="green" value={s.pendingLostFound} label="Pending Lost & Found" />
        </div>
      ) : <LoadingSpinner message="Loading dashboard..." />}

      <section className="stack">
        <div className="card-head" style={{ marginBottom: 0 }}><h2>Live Emergency Panel</h2><button className="btn btn-sm btn-ghost" onClick={() => navigate('/admin/sos')}>All SOS</button></div>
        {sos.loading && !sos.data ? <LoadingSpinner message="Loading SOS alerts..." /> : !sos.data?.length ? (
          <div className="card"><EmptyState icon={ShieldCheck} title="No active emergencies" message="New SOS alerts appear here instantly." /></div>
        ) : (
          <div className="grid cols-2">
            {sos.data.map((x) => <SosAlertCard key={x.id} sos={x} busy={sos.busyId === x.id} onAction={sos.act} onView={setView} />)}
          </div>
        )}
      </section>

      <div className="grid dash">
        <section className="card">
          <div className="card-head"><h2>Recent Activity</h2><button className="btn btn-sm btn-ghost" onClick={() => navigate('/admin/incidents')}>Manage incidents</button></div>
          {activity.loading && !activity.data ? <LoadingSpinner /> : <ActivityList items={activity.data} admin />}
        </section>
        <section className="card">
          <div className="card-head"><h2>Manage</h2></div>
          <div className="quick-grid">
            <button className="quick" onClick={() => navigate('/admin/incidents')}><FileWarning size={22} color="var(--red)" /> Incidents</button>
            <button className="quick" onClick={() => navigate('/admin/lost-found')}><PackageSearch size={22} color="var(--info)" /> Lost &amp; Found</button>
            <button className="quick" onClick={() => navigate('/admin/contacts')}><PhoneCall size={22} color="var(--success)" /> Contacts</button>
            <button className="quick" onClick={() => navigate('/admin/announcements')}><Megaphone size={22} color="var(--warning)" /> Announcements</button>
          </div>
        </section>
      </div>
      {view && <SosDetailsModal sos={view} onClose={() => setView(null)} />}
    </div>
  );
}
