import { useNavigate } from 'react-router-dom';
import { FileText, AlertTriangle, CheckCircle2, PackageSearch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/NotificationContext';
import useAsync from '../hooks/useAsync';
import { statsService } from '../services/statsService';
import StatCard from '../components/StatCard';
import SOSButton from '../components/SOSButton';
import ActivityList from '../components/ActivityList';
import QuickActions from '../components/QuickActions';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stats = useAsync(() => statsService.student(), []);
  const activity = useAsync(() => statsService.activity(), []);

  const refresh = () => { stats.reload(); activity.reload(); };
  useRealtime('notification', refresh);
  useRealtime('sos', refresh);
  useRealtime('resync', refresh);

  if (stats.loading && !stats.data) return <LoadingSpinner message="Loading dashboard..." />;
  const s = stats.data;
  const first = user.name.split(' ')[0];

  return (
    <div className="stack" style={{ gap: 20 }}>
      <ErrorAlert message={stats.error} onRetry={stats.reload} />
      {s && (
        <>
          <section className="hero">
            <div>
              <span className={`status-pill ${s.campusStatus === 'NORMAL' ? '' : 'elevated'}`}>
                <span className="dot" /> Campus status: {s.campusStatus === 'NORMAL' ? 'Normal' : 'Elevated'}
              </span>
              <h1>Welcome back, {first}</h1>
              <p>
                You have {s.unreadNotifications} unread notification{s.unreadNotifications === 1 ? '' : 's'}
                {' '}and {s.activeAlertsMine} report{s.activeAlertsMine === 1 ? '' : 's'} still in progress.
              </p>
              <div className="safety">
                <div className="small">Safety profile: {s.safetyProfile}%</div>
                <div className="bar"><div style={{ width: `${s.safetyProfile}%` }} /></div>
                {s.safetyProfile < 100 && (
                  <button type="button" className="btn btn-sm" onClick={() => navigate('/profile')}
                    style={{ background: 'rgba(255,255,255,.14)', color: '#fff', marginTop: 10 }}>Complete your profile</button>
                )}
              </div>
            </div>
            <SOSButton variant="hero" />
          </section>

          <div className="grid cols-4">
            <StatCard icon={FileText} tone="blue" value={s.myReports} label="My Reports" sub={`+${s.reportsThisWeek} this week`} />
            <StatCard icon={AlertTriangle} tone="red" value={s.activeAlerts} label="Active Alerts" sub={`${s.activeAlertsMine} near you`} />
            <StatCard icon={CheckCircle2} tone="green" value={s.resolvedCases} label="Resolved Cases" sub={`${s.resolutionRate}% resolution`} />
            <StatCard icon={PackageSearch} tone="amber" value={s.lostFoundMatches} label="Lost & Found Matches" sub={`${s.awaitingPickup} awaiting pickup`} />
          </div>
        </>
      )}

      <div className="grid dash">
        <section className="card">
          <div className="card-head">
            <h2>Recent Activity</h2>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/my-reports')}>View all</button>
          </div>
          {activity.loading && !activity.data ? <LoadingSpinner /> : <ActivityList items={activity.data} />}
        </section>
        <section className="card">
          <div className="card-head"><h2>Quick Actions</h2></div>
          <QuickActions />
        </section>
      </div>
    </div>
  );
}
