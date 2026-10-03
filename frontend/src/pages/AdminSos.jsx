import { useState } from 'react';
import { Siren } from 'lucide-react';
import useLiveSos from '../hooks/useLiveSos';
import SosAlertCard from '../components/SosAlertCard';
import SosDetailsModal from '../components/SosDetailsModal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { formatWhen } from '../utils/format';

const ACTIVE = ['TRIGGERED', 'ACKNOWLEDGED', 'DISPATCHED'];

export default function AdminSos() {
  const sos = useLiveSos(false);
  const [view, setView] = useState(null);
  const all = sos.data || [];
  const active = all.filter((s) => ACTIVE.includes(s.status));
  const closed = all.filter((s) => !ACTIVE.includes(s.status));

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head"><div><h1>Real-Time SOS Monitoring</h1><p>New alerts appear instantly, no refresh needed.</p></div></div>
      <ErrorAlert message={sos.error || sos.actionError} onRetry={sos.reload} />
      {sos.loading && !sos.data ? <LoadingSpinner message="Loading SOS alerts..." /> : (
        <>
          <section className="stack">
            <h2>Active ({active.length})</h2>
            {active.length === 0 ? <div className="card"><EmptyState icon={Siren} title="No active emergencies" message="You're all clear." /></div> : (
              <div className="grid cols-2">{active.map((x) => <SosAlertCard key={x.id} sos={x} busy={sos.busyId === x.id} onAction={sos.act} onView={setView} />)}</div>
            )}
          </section>
          <section className="card">
            <div className="card-head"><h2>History</h2></div>
            {closed.length === 0 ? <p className="muted small">No closed SOS requests yet.</p> : (
              <div className="table-wrap"><table className="table">
                <thead><tr><th>SOS ID</th><th>Person</th><th>Location</th><th>Type</th><th>Raised</th><th>Status</th></tr></thead>
                <tbody>{closed.map((s) => (
                  <tr key={s.id} className="clickable" onClick={() => setView(s)}>
                    <td className="strong">{s.sosId}</td><td>{s.userName}</td><td>{s.location || '—'}</td><td>{s.type || 'Emergency'}</td>
                    <td>{formatWhen(s.createdAt)}</td><td><StatusBadge status={s.status} /></td>
                  </tr>))}</tbody>
              </table></div>
            )}
          </section>
        </>
      )}
      {view && <SosDetailsModal sos={view} onClose={() => setView(null)} />}
    </div>
  );
}
