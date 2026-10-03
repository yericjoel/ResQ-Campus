import { Siren } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatTime, formatWhen } from '../utils/format';
import { label } from '../utils/labels';

/** Emergency card for administrators. onAction(sos, status) changes the status; onView opens the details. */
export default function SosAlertCard({ sos, onAction, onView, busy }) {
  const fresh = sos.status === 'TRIGGERED';
  return (
    <div className={`sos-card ${fresh ? '' : 'calm'}`}>
      <div className="row between wrap">
        <span className="flag">{fresh && <span className="pulse" />}<Siren size={16} /> {fresh ? 'NEW EMERGENCY SOS' : 'SOS IN PROGRESS'} · {sos.sosId}</span>
        <StatusBadge status={sos.status} />
      </div>
      <div>
        <strong style={{ fontSize: 18 }}>{sos.userName}</strong>
        <div className="small muted">{label(sos.userRole)}{sos.department ? ` · ${sos.department}` : ''}</div>
      </div>
      <dl className="kv">
        <dt>Location</dt><dd>{sos.location || (sos.latitude ? `${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)}` : 'Not shared')}</dd>
        <dt>Type</dt><dd>{sos.type || 'Emergency'}</dd>
        <dt>Time</dt><dd>{formatTime(sos.createdAt)} <span className="muted">({formatWhen(sos.createdAt)})</span></dd>
      </dl>
      <div className="row wrap">
        {sos.status === 'TRIGGERED' && <button className="btn btn-dark btn-sm" disabled={busy} onClick={() => onAction(sos, 'ACKNOWLEDGED')}>Acknowledge</button>}
        {['TRIGGERED', 'ACKNOWLEDGED'].includes(sos.status) && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onAction(sos, 'DISPATCHED')}>Dispatch</button>}
        {['ACKNOWLEDGED', 'DISPATCHED'].includes(sos.status) && <button className="btn btn-success btn-sm" disabled={busy} onClick={() => onAction(sos, 'RESOLVED')}>Resolve</button>}
        <button className="btn btn-ghost btn-sm" onClick={() => onView(sos)}>View details</button>
      </div>
    </div>
  );
}
