import { useNavigate } from 'react-router-dom';
import { FileWarning, Siren, Activity } from 'lucide-react';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import { formatWhen } from '../utils/format';

export default function ActivityList({ items, admin = false }) {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return <EmptyState icon={Activity} title="No activity yet" message="Reports and SOS alerts will appear here." />;
  }

  const open = (item) => {
    if (item.kind === 'SOS') navigate(admin ? '/admin/sos' : '/sos');
    else navigate(admin ? `/admin/incidents?open=${item.refId}` : `/my-reports/${item.refId}`);
  };

  return (
    <div>
      {items.map((item) => (
        <button key={`${item.kind}-${item.refId}`} type="button" className="activity-item" onClick={() => open(item)}>
          <span className={`activity-icon ${item.kind === 'SOS' ? 'sos' : ''}`}>
            {item.kind === 'SOS' ? <Siren size={19} /> : <FileWarning size={19} />}
          </span>
          <span className="grow">
            <strong style={{ display: 'block' }}>{item.title}</strong>
            <span className="activity-meta">
              {item.location} — {item.code} — {formatWhen(item.createdAt)}
            </span>
          </span>
          <StatusBadge status={item.status} />
        </button>
      ))}
    </div>
  );
}
