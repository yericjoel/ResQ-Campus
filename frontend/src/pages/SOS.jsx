import { useState } from 'react';
import { Siren, History } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { sosService } from '../services/sosService';
import { useRealtime } from '../context/NotificationContext';
import { useSos } from '../context/SosContext';
import SosTimeline from '../components/SosTimeline';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { formatWhen } from '../utils/format';

const ACTIVE = ['TRIGGERED', 'ACKNOWLEDGED', 'DISPATCHED'];

export default function SOS() {
  const { openSos } = useSos();
  const { data, loading, error, reload } = useAsync(() => sosService.mine(), []);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  useRealtime('sos', () => reload());
  useRealtime('resync', () => reload());

  if (loading && !data) return <LoadingSpinner message="Loading SOS..." />;
  const list = data || [];
  const active = list.find((s) => ACTIVE.includes(s.status));
  const history = list.filter((s) => s !== active);

  const cancel = async () => {
    setBusy(true);
    setActionError('');
    try {
      await sosService.updateStatus(active.id, 'CANCELLED');
      reload();
    } catch (e) {
      setActionError(e?.response?.data?.message || 'Could not cancel the SOS.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head"><div><h1>SOS</h1><p>Emergency alerts go straight to authorized campus personnel.</p></div></div>
      <ErrorAlert message={error || actionError} onRetry={reload} />

      {active ? (
        <section className="sos-card">
          <div className="flag"><span className="pulse" /> ACTIVE SOS · {active.sosId}</div>
          <div className="row between"><strong>{active.type || 'Emergency'}{active.location ? ` — ${active.location}` : ''}</strong><StatusBadge status={active.status} /></div>
          <SosTimeline sos={active} />
          {active.status === 'TRIGGERED' && (
            <div><button className="btn btn-danger-ghost btn-sm" disabled={busy} onClick={cancel}>{busy ? 'Cancelling...' : 'Cancel this SOS (false alarm)'}</button></div>
          )}
        </section>
      ) : (
        <section className="card center stack" style={{ alignItems: 'center', padding: 36 }}>
          <h2>In an emergency, don&apos;t wait.</h2>
          <p className="muted">One tap alerts campus security with your name, department and location.</p>
          <button type="button" className="btn-sos hero-size" onClick={openSos}><Siren size={26} /> Emergency SOS</button>
        </section>
      )}

      <section className="card">
        <div className="card-head"><h2>SOS History</h2></div>
        {history.length === 0 ? (
          <EmptyState icon={History} title="No past SOS requests" message="Your previous alerts will be listed here." />
        ) : (
          history.map((s) => (
            <div key={s.id} className="activity-item" style={{ cursor: 'default' }}>
              <span className="activity-icon sos"><Siren size={19} /></span>
              <span className="grow"><strong>{s.type || 'Emergency'}</strong><span className="activity-meta" style={{ display: 'block' }}>{s.sosId} — {formatWhen(s.createdAt)}</span></span>
              <StatusBadge status={s.status} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
