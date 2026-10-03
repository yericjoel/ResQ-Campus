import { useState } from 'react';
import { Users } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { adminService } from '../services/statsService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { ROLES } from '../utils/labels';
import { formatDate } from '../utils/format';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useAsync(() => adminService.users(), []);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  const update = async (u, patch) => {
    setErr('');
    try { await adminService.updateUser(u.id, patch); reload(); } catch (e) { setErr(getErrorMessage(e)); }
  };
  const rows = (data || []).filter((u) => `${u.name} ${u.email} ${u.studentId || ''}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head"><div><h1>User Management</h1><p>Change roles or deactivate accounts.</p></div></div>
      <ErrorAlert message={error || err} onRetry={reload} />
      <div className="card">
        <div className="field" style={{ maxWidth: 320, marginBottom: 14 }}><input className="input" placeholder="Filter by name, email or ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter users" /></div>
        {loading && !data ? <LoadingSpinner message="Loading users..." /> : !rows.length ? <EmptyState icon={Users} title="No users found" /> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>ID</th><th>Department</th><th>Joined</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>{rows.map((u) => (
              <tr key={u.id}>
                <td className="strong">{u.name}</td><td>{u.email}</td><td>{u.studentId || '—'}</td><td>{u.department || '—'}</td><td>{formatDate(u.createdAt)}</td>
                <td><select className="input" style={{ minHeight: 34, padding: '4px 10px' }} value={u.role} disabled={u.id === me.id}
                  onChange={(e) => update(u, { role: e.target.value })} aria-label={`Role for ${u.name}`}>{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></td>
                <td><button className="btn btn-ghost btn-sm" disabled={u.id === me.id} onClick={() => update(u, { active: !u.active })}>
                  {u.active ? <StatusBadge status="RESOLVED" text="Active" /> : <StatusBadge status="REJECTED" text="Inactive" />}</button></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
