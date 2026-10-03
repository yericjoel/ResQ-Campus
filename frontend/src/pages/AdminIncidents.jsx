import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileWarning } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { incidentService } from '../services/incidentService';
import { adminService } from '../services/statsService';
import { getErrorMessage } from '../services/api';
import { useNotifications, useRealtime } from '../context/NotificationContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { IncidentDetail } from './MyReports';
import { INCIDENT_STATUSES, SEVERITIES, label } from '../utils/labels';
import { formatWhen } from '../utils/format';

const FILTERS = [['all', 'All'], ['open', 'Open'], ['in_review', 'In Review'], ['high', 'High Priority'], ['resolved', 'Resolved']];

function Manage({ id, onClose, onChanged }) {
  const { pushToast } = useNotifications();
  const { data, loading, error, reload } = useAsync(() => incidentService.get(id), [id]);
  const responders = useAsync(() => adminService.responders(), []);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (data) setF({ status: data.status, severity: data.severity, assignedTo: data.assignedToId || '', note: '' });
  }, [data]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await incidentService.update(id, { status: f.status, severity: f.severity, assignedTo: f.assignedTo ? Number(f.assignedTo) : null, note: f.note || null });
      pushToast({ title: 'Incident updated', message: 'The reporter has been notified of important changes.', tone: 'success' });
      await reload();
      onChanged();
    } catch (ex) {
      setErr(getErrorMessage(ex));
    } finally {
      setBusy(false);
    }
  };
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  return (
    <Modal title="Incident details" onClose={onClose} wide>
      <ErrorAlert message={error || err} />
      {loading && !data ? <LoadingSpinner message="Loading incident..." /> : data && f && (
        <div className="stack" style={{ gap: 22 }}>
          <IncidentDetail incident={data} />
          <form className="stack" onSubmit={save} style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
            <h3 style={{ fontSize: 16 }}>Update incident</h3>
            <div className="form-grid">
              <div className="field"><label>Status</label>
                <select className="input" value={f.status} onChange={set('status')}>{INCIDENT_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              <div className="field"><label>Severity</label>
                <select className="input" value={f.severity} onChange={set('severity')}>{SEVERITIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              <div className="field full"><label>Assign responder</label>
                <select className="input" value={f.assignedTo} onChange={set('assignedTo')}>
                  <option value="">Unassigned</option>
                  {(responders.data || []).map((r) => <option key={r.id} value={r.id}>{r.name} ({label(r.role)})</option>)}
                </select></div>
              <div className="field full"><label>Note (visible in the timeline)</label><textarea className="textarea" maxLength={1000} value={f.note} onChange={set('note')} /></div>
            </div>
            <div className="modal-actions" style={{ marginTop: 0 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
              <button type="button" className="btn btn-success" disabled={busy || data.status === 'RESOLVED'}
                onClick={() => { setF((v) => ({ ...v, status: 'RESOLVED' })); setTimeout(() => document.getElementById('save-incident')?.click(), 0); }}>Resolve incident</button>
              <button id="save-incident" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}

export default function AdminIncidents() {
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const list = useAsync(() => incidentService.all(filter), [filter]);
  const openId = params.get('open');

  useRealtime('incident', () => list.reload());
  useRealtime('resync', () => list.reload());

  const open = (id) => setParams({ open: id });
  const close = () => setParams({});

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head"><div><h1>Incident Management</h1><p>Review, assign and resolve reported incidents.</p></div></div>
      <div className="chips">
        {FILTERS.map(([key, text]) => <button key={key} className={`chip ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{text}</button>)}
      </div>
      <ErrorAlert message={list.error} onRetry={list.reload} />
      <div className="card">
        {list.loading && !list.data ? <LoadingSpinner message="Loading incidents..." /> : !list.data?.length ? (
          <EmptyState icon={FileWarning} title="No incidents" message="No incidents match this filter." />
        ) : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Report ID</th><th>Title</th><th>Reporter</th><th>Location</th><th>Severity</th><th>Status</th><th>Responder</th><th>Updated</th></tr></thead>
            <tbody>{list.data.map((i) => (
              <tr key={i.id} className="clickable" onClick={() => open(i.id)}>
                <td className="strong">{i.reportId}</td><td>{i.title}</td><td>{i.reporterName}</td><td>{i.location}</td>
                <td><StatusBadge status={i.severity} /></td><td><StatusBadge status={i.status} /></td>
                <td>{i.assignedToName || '—'}</td><td>{formatWhen(i.updatedAt)}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
      {openId && <Manage id={openId} onClose={close} onChanged={list.reload} />}
    </div>
  );
}
