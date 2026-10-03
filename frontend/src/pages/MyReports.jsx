import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Check } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { incidentService } from '../services/incidentService';
import { useRealtime } from '../context/NotificationContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import AuthImage from '../components/AuthImage';
import { formatDate, formatDateTime, formatWhen } from '../utils/format';
import { label } from '../utils/labels';

export function IncidentDetail({ incident }) {
  return (
    <div className="stack">
      <div className="row between wrap">
        <div><h2>{incident.title}</h2><span className="small muted">{incident.reportId}</span></div>
        <div className="row"><StatusBadge status={incident.severity} /><StatusBadge status={incident.status} /></div>
      </div>
      <dl className="kv">
        <dt>Type</dt><dd>{label(incident.type)}</dd>
        <dt>Location</dt><dd>{incident.location}</dd>
        <dt>Date</dt><dd>{formatDateTime(incident.incidentDate)}</dd>
        {incident.reporterName && (<><dt>Reported by</dt><dd>{incident.reporterName}{incident.reporterDepartment ? ` · ${incident.reporterDepartment}` : ''}</dd></>)}
        {incident.assignedToName && (<><dt>Responder</dt><dd>{incident.assignedToName}</dd></>)}
        <dt>Last updated</dt><dd>{formatWhen(incident.updatedAt)}</dd>
      </dl>
      <p style={{ whiteSpace: 'pre-wrap' }}>{incident.description}</p>
      {incident.evidence?.length > 0 && (
        <div className="row wrap">
          {incident.evidence.map((ev) => (
            <AuthImage key={ev.id} src={ev.fileUrl} alt="Evidence" className="item-thumb" />
          ))}
        </div>
      )}
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Timeline</h3>
        <ul className="timeline">
          {(incident.timeline || []).map((t, i, arr) => (
            <li key={t.id} className={i === arr.length - 1 ? 'current' : 'done'}>
              <span className="dot">{i !== arr.length - 1 && <Check size={12} />}</span>
              <span>
                <strong>{label(t.status)}</strong>
                <span className="small muted" style={{ display: 'block' }}>{t.note || 'Status updated'}{t.authorName ? ` — ${t.authorName}` : ''}</span>
                <span className="xsmall">{formatDateTime(t.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function MyReports() {
  const { id } = useParams();
  const navigate = useNavigate();
  const list = useAsync(() => incidentService.mine(), []);
  const detail = useAsync(() => (id ? incidentService.get(id) : Promise.resolve(null)), [id]);

  useRealtime('notification', () => { list.reload(); if (id) detail.reload(); });
  useRealtime('resync', () => { list.reload(); if (id) detail.reload(); });

  if (id) {
    return (
      <div className="stack" style={{ maxWidth: 820 }}>
        <div><button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-reports')}><ArrowLeft size={15} /> My Reports</button></div>
        <ErrorAlert message={detail.error} onRetry={detail.reload} />
        <div className="card">{detail.loading && !detail.data ? <LoadingSpinner message="Loading report..." /> : detail.data && <IncidentDetail incident={detail.data} />}</div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <div><h1>My Reports</h1><p>Everything you have reported and where it stands.</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/report')}>Report an Incident</button>
      </div>
      <ErrorAlert message={list.error} onRetry={list.reload} />
      <div className="card">
        {list.loading && !list.data ? <LoadingSpinner message="Loading reports..." />
          : !list.data?.length ? (
            <EmptyState icon={ClipboardList} title="No reports yet" message="No reports yet. Your submitted incidents will appear here."
              action={<button className="btn btn-primary" onClick={() => navigate('/report')}>Report an Incident</button>} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Report ID</th><th>Title</th><th>Type</th><th>Location</th><th>Date</th><th>Status</th><th>Last updated</th></tr></thead>
                <tbody>
                  {list.data.map((i) => (
                    <tr key={i.id} className="clickable" onClick={() => navigate(`/my-reports/${i.id}`)}>
                      <td className="strong">{i.reportId}</td><td>{i.title}</td><td>{label(i.type)}</td><td>{i.location}</td>
                      <td>{formatDate(i.incidentDate)}</td><td><StatusBadge status={i.status} /></td><td>{formatWhen(i.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
