import useAsync from '../hooks/useAsync';
import { incidentService } from '../services/incidentService';
import { sosService } from '../services/sosService';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { FileWarning, Siren, CheckCircle2, Clock } from 'lucide-react';
import { INCIDENT_STATUSES, INCIDENT_TYPES, SEVERITIES } from '../utils/labels';

function Bars({ title, rows, red }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="card">
      <div className="card-head"><h2>{title}</h2></div>
      {rows.map((r) => (
        <div key={r.label} className="bar-row">
          <span>{r.label}</span>
          <div className="bar-track"><div className={`bar-fill ${red ? 'red' : ''}`} style={{ width: `${(r.count / max) * 100}%` }} /></div>
          <strong>{r.count}</strong>
        </div>
      ))}
    </section>
  );
}

/** Statistics computed from the live database records. */
export default function AdminReports() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [incidents, sos] = await Promise.all([incidentService.all('all'), sosService.all(false)]);
    return { incidents, sos };
  }, []);

  if (loading && !data) return <LoadingSpinner message="Loading statistics..." />;
  const incidents = data?.incidents || [];
  const sos = data?.sos || [];
  const count = (list, key, value) => list.filter((x) => x[key] === value).length;
  const resolved = count(incidents, 'status', 'RESOLVED');

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head"><div><h1>Reports &amp; Statistics</h1><p>Campus safety activity at a glance.</p></div></div>
      <ErrorAlert message={error} onRetry={reload} />
      <div className="grid cols-4">
        <StatCard icon={FileWarning} tone="blue" value={incidents.length} label="Total incidents" />
        <StatCard icon={CheckCircle2} tone="green" value={`${incidents.length ? Math.round((100 * resolved) / incidents.length) : 0}%`} label="Resolution rate" sub={`${resolved} resolved`} />
        <StatCard icon={Siren} tone="red" value={sos.length} label="Total SOS alerts" />
        <StatCard icon={Clock} tone="amber" value={incidents.filter((i) => ['OPEN', 'IN_REVIEW', 'DISPATCHED'].includes(i.status)).length} label="Unresolved incidents" />
      </div>
      <div className="grid cols-2">
        <Bars title="Incidents by status" rows={INCIDENT_STATUSES.map((o) => ({ label: o.label, count: count(incidents, 'status', o.value) }))} />
        <Bars title="Incidents by severity" red rows={SEVERITIES.map((o) => ({ label: o.label, count: count(incidents, 'severity', o.value) }))} />
        <Bars title="Incidents by type" rows={INCIDENT_TYPES.map((o) => ({ label: o.label, count: count(incidents, 'type', o.value) }))} />
        <Bars title="SOS by status" red rows={['TRIGGERED', 'ACKNOWLEDGED', 'DISPATCHED', 'RESOLVED', 'CANCELLED'].map((s) => ({ label: s.charAt(0) + s.slice(1).toLowerCase(), count: count(sos, 'status', s) }))} />
      </div>
    </div>
  );
}
