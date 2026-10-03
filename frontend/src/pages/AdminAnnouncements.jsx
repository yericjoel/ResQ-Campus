import { useState } from 'react';
import { Plus, Megaphone, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { announcementService } from '../services/announcementService';
import { getErrorMessage } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_PRIORITIES, label } from '../utils/labels';
import { formatWhen } from '../utils/format';

function Form({ item, onClose, onSaved }) {
  const [f, setF] = useState({ title: item?.title || '', description: item?.description || '', category: item?.category || 'GENERAL', priority: item?.priority || 'NORMAL', published: item?.published ?? true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (item) await announcementService.update(item.id, f); else await announcementService.create(f);
      onSaved(f);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={item ? 'Edit announcement' : 'New announcement'} onClose={onClose} locked={busy} wide>
      <form className="stack" onSubmit={submit}>
        <ErrorAlert message={error} />
        <div className="form-grid">
          <div className="field full"><label>Title</label><input className="input" required maxLength={150} value={f.title} onChange={set('title')} /></div>
          <div className="field full"><label>Description</label><textarea className="textarea" required value={f.description} onChange={set('description')} /></div>
          <div className="field"><label>Category</label>
            <select className="input" value={f.category} onChange={set('category')}>{ANNOUNCEMENT_CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="field"><label>Priority</label>
            <select className="input" value={f.priority} onChange={set('priority')}>{ANNOUNCEMENT_PRIORITIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <label className="row" style={{ gridColumn: '1 / -1' }}><input type="checkbox" checked={f.published} onChange={(e) => setF((v) => ({ ...v, published: e.target.checked }))} /> Publish now</label>
        </div>
        {f.published && f.priority !== 'NORMAL' && <div className="alert info">Important and critical announcements are pushed to connected students in real time.</div>}
        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : f.published ? 'Save & publish' : 'Save draft'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminAnnouncements() {
  const { pushToast } = useNotifications();
  const { data, loading, error, reload } = useAsync(() => announcementService.list(), []);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  const togglePublish = async (a) => {
    try {
      await announcementService.update(a.id, { title: a.title, description: a.description, category: a.category, priority: a.priority, published: !a.published });
      reload();
    } catch (e) { setErr(getErrorMessage(e)); }
  };
  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try { await announcementService.remove(a.id); reload(); } catch (e) { setErr(getErrorMessage(e)); }
  };

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 900 }}>
      <div className="page-head">
        <div><h1>Announcements</h1><p>Create, publish and unpublish campus notices.</p></div>
        <button className="btn btn-primary" onClick={() => setForm('new')}><Plus size={16} /> New announcement</button>
      </div>
      <ErrorAlert message={error || err} onRetry={reload} />
      {loading && !data ? <LoadingSpinner message="Loading announcements..." /> : !data?.length ? (
        <div className="card"><EmptyState icon={Megaphone} title="No announcements" message="Create the first announcement." /></div>
      ) : data.map((a) => (
        <article key={a.id} className={`card notice-card ${a.priority.toLowerCase()}`}>
          <div className="row between wrap">
            <h3>{a.title}</h3>
            <div className="row"><span className="badge tone-dark">{label(a.category)}</span><StatusBadge status={a.priority} />
              <span className={`badge ${a.published ? 'tone-success' : 'tone-muted'}`}>{a.published ? 'Published' : 'Draft'}</span></div>
          </div>
          <p className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{a.description}</p>
          <div className="row between wrap">
            <span className="xsmall">By {a.authorName} · {formatWhen(a.publishedAt || a.createdAt)}</span>
            <div className="row wrap">
              <button className="btn btn-ghost btn-sm" onClick={() => togglePublish(a)}>{a.published ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setForm(a)}><Pencil size={14} /> Edit</button>
              <button className="btn btn-danger-ghost btn-sm" onClick={() => remove(a)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </article>
      ))}
      {form && <Form item={form === 'new' ? null : form} onClose={() => setForm(null)}
        onSaved={(f) => { setForm(null); reload(); pushToast({ title: f.published ? 'Announcement published' : 'Draft saved', message: f.title, tone: 'success' }); }} />}
    </div>
  );
}
