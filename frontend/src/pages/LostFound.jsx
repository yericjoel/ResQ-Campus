import { useState } from 'react';
import { PackageSearch, Plus, Sparkles, Trash2, MapPin, CalendarDays, ImagePlus } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { lostFoundService } from '../services/lostFoundService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications, useRealtime } from '../context/NotificationContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import AuthImage from '../components/AuthImage';
import { LOST_FOUND_CATEGORIES } from '../utils/labels';
import { formatDate, todayInputValue } from '../utils/format';

const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function ItemForm({ itemType, onClose, onSaved }) {
  const [f, setF] = useState({ itemName: '', category: LOST_FOUND_CATEGORIES[0], description: '', location: '', date: todayInputValue(), contactPreference: '' });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  const isLost = itemType === 'LOST';

  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!OK_TYPES.includes(file.type)) return setError('Photo must be a JPG, PNG or WebP image.');
    if (file.size > 5 * 1024 * 1024) return setError('Photo must be smaller than 5 MB.');
    setError('');
    setPhoto(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const values = { ...f, itemType };
      if (!isLost) delete values.contactPreference;
      await lostFoundService.create(values, photo);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the item.'));
      setBusy(false);
    }
  };

  return (
    <Modal title={isLost ? 'Report a lost item' : 'Report a found item'} onClose={onClose} locked={busy} wide>
      <form className="stack" onSubmit={submit}>
        <ErrorAlert message={error} />
        <div className="form-grid">
          <div className="field"><label>Item name</label><input className="input" required maxLength={120} value={f.itemName} onChange={set('itemName')} /></div>
          <div className="field"><label>Category</label>
            <select className="input" value={f.category} onChange={set('category')}>{LOST_FOUND_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field full"><label>Description</label><textarea className="textarea" value={f.description} onChange={set('description')} placeholder="Colour, brand, marks, contents..." /></div>
          <div className="field"><label>{isLost ? 'Last seen location' : 'Found location'}</label><input className="input" required value={f.location} onChange={set('location')} /></div>
          <div className="field"><label>Date</label><input className="input" type="date" required max={todayInputValue()} value={f.date} onChange={set('date')} /></div>
          {isLost && <div className="field full"><label>Contact preference</label><input className="input" value={f.contactPreference} onChange={set('contactPreference')} placeholder="e.g. Phone 98xxxxxx89, or in-app notification" /></div>}
          <div className="field full"><label>Photo (optional)</label>
            <div className="upload"><ImagePlus size={26} color="var(--text-3)" /><div className="grow small muted">{photo ? photo.name : 'JPG, PNG or WebP, up to 5 MB'}</div>
              <input type="file" accept={OK_TYPES.join(',')} onChange={pick} aria-label="Photo" /></div></div>
        </div>
        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Submit'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Suggestions({ item, onClose, onProposed }) {
  const { data, loading, error } = useAsync(() => lostFoundService.suggestions(item.id), [item.id]);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');
  const propose = async (other) => {
    setBusy(other.id);
    setErr('');
    try {
      const [lost, found] = item.itemType === 'LOST' ? [item.id, other.id] : [other.id, item.id];
      await lostFoundService.proposeMatch(lost, found);
      onProposed();
    } catch (e) {
      setErr(getErrorMessage(e));
      setBusy(null);
    }
  };
  return (
    <Modal title={`Possible matches for "${item.itemName}"`} onClose={onClose} wide>
      <ErrorAlert message={error || err} />
      {loading ? <LoadingSpinner message="Looking for matches..." /> : !data?.length ? (
        <EmptyState icon={Sparkles} title="No similar items yet" message="We'll keep looking as new items are reported." />
      ) : data.map(({ item: other, score }) => (
        <div key={other.id} className="activity-item" style={{ cursor: 'default' }}>
          <span className="grow"><strong>{other.itemName}</strong>
            <span className="activity-meta" style={{ display: 'block' }}>{other.category} · {other.location} · {formatDate(other.date)} · {score}% similar</span></span>
          <button className="btn btn-sm btn-primary" disabled={busy === other.id} onClick={() => propose(other)}>{busy === other.id ? '...' : 'Propose match'}</button>
        </div>
      ))}
    </Modal>
  );
}

function ItemCard({ item, canManage, onSuggest, onDelete, onStatus }) {
  return (
    <div className="card item-card">
      <AuthImage src={item.imageUrl} alt={item.itemName} className="thumb" fallback={<div className="item-thumb"><PackageSearch size={32} /></div>} />
      <div className="row between"><strong>{item.itemName}</strong><div className="row"><StatusBadge status={item.itemType} /><StatusBadge status={item.status} /></div></div>
      {item.description && <p className="small muted">{item.description}</p>}
      <div className="small muted stack" style={{ gap: 4 }}>
        <span className="row"><MapPin size={14} /> {item.location}</span>
        <span className="row"><CalendarDays size={14} /> {formatDate(item.date)} · {item.category}</span>
        {item.ownerName && <span className="xsmall">Reported by {item.ownerName}</span>}
      </div>
      {canManage && (
        <div className="row wrap">
          {item.status === 'OPEN' && <button className="btn btn-secondary btn-sm" onClick={() => onSuggest(item)}><Sparkles size={14} /> Find matches</button>}
          {onStatus && item.status === 'MATCHED' && <button className="btn btn-success btn-sm" onClick={() => onStatus(item, 'RETURNED')}>Mark returned</button>}
          <button className="btn btn-danger-ghost btn-sm" onClick={() => onDelete(item)}><Trash2 size={14} /> Delete</button>
        </div>
      )}
    </div>
  );
}

/** Shared by the student page and the admin page (admin = true shows everything and extra controls). */
export function LostFoundBoard({ admin = false }) {
  const { user } = useAuth();
  const { pushToast } = useNotifications();
  const [tab, setTab] = useState('LOST');
  const [form, setForm] = useState(null);
  const [suggest, setSuggest] = useState(null);
  const [error, setError] = useState('');
  const items = useAsync(() => lostFoundService.list(), []);
  const matches = useAsync(() => lostFoundService.matches(), []);

  useRealtime('notification', (n) => { if (n.type === 'LOST_FOUND') { items.reload(); matches.reload(); } });
  useRealtime('resync', () => { items.reload(); matches.reload(); });

  const reloadAll = () => { items.reload(); matches.reload(); };
  const canManage = (item) => admin || item.userId === user.id;

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.itemName}"?`)) return;
    try { await lostFoundService.remove(item.id); reloadAll(); } catch (e) { setError(getErrorMessage(e)); }
  };
  const setStatus = async (item, status) => {
    try { await lostFoundService.update(item.id, { status }); reloadAll(); } catch (e) { setError(getErrorMessage(e)); }
  };
  const review = async (m, matchStatus) => {
    try {
      await lostFoundService.reviewMatch(m.id, matchStatus);
      pushToast({ title: matchStatus === 'VERIFIED' ? 'Match verified' : 'Match rejected', message: m.lostItem.itemName, tone: 'success' });
      reloadAll();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const list = (items.data || []).filter((i) => i.itemType === tab);
  const pending = (matches.data || []).filter((m) => m.matchStatus === 'PENDING').length;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <div><h1>Lost &amp; Found</h1><p>Report what you lost or found, and verify possible matches.</p></div>
        <div className="row wrap">
          <button className="btn btn-primary" onClick={() => setForm('LOST')}><Plus size={16} /> Report lost item</button>
          <button className="btn btn-secondary" onClick={() => setForm('FOUND')}><Plus size={16} /> Report found item</button>
        </div>
      </div>
      <ErrorAlert message={error || items.error} onRetry={items.reload} />
      <div className="chips">
        <button className={`chip ${tab === 'LOST' ? 'active' : ''}`} onClick={() => setTab('LOST')}>Lost items</button>
        <button className={`chip ${tab === 'FOUND' ? 'active' : ''}`} onClick={() => setTab('FOUND')}>Found items</button>
        <button className={`chip ${tab === 'MATCHES' ? 'active' : ''}`} onClick={() => setTab('MATCHES')}>Matches{pending ? ` (${pending})` : ''}</button>
      </div>

      {tab === 'MATCHES' ? (
        <div className="card">
          {matches.loading && !matches.data ? <LoadingSpinner message="Loading matches..." /> : !matches.data?.length ? (
            <EmptyState icon={Sparkles} title="No matches yet" message="Possible matches between lost and found items will show here." />
          ) : matches.data.map((m) => (
            <div key={m.id} className="activity-item" style={{ cursor: 'default', flexWrap: 'wrap' }}>
              <span className="grow">
                <strong>Lost: {m.lostItem.itemName}</strong> ↔ <strong>Found: {m.foundItem.itemName}</strong>
                <span className="activity-meta" style={{ display: 'block' }}>Lost at {m.lostItem.location} · found at {m.foundItem.location}</span>
              </span>
              <StatusBadge status={m.matchStatus} />
              {m.matchStatus === 'PENDING' && (
                <span className="row">
                  <button className="btn btn-success btn-sm" onClick={() => review(m, 'VERIFIED')}>Verify</button>
                  <button className="btn btn-danger-ghost btn-sm" onClick={() => review(m, 'REJECTED')}>Not a match</button>
                </span>
              )}
            </div>
          ))}
        </div>
      ) : items.loading && !items.data ? <LoadingSpinner message="Loading items..." /> : list.length === 0 ? (
        <div className="card"><EmptyState icon={PackageSearch} title={`No ${tab.toLowerCase()} items`} message="Nothing has been reported here yet." /></div>
      ) : (
        <div className="grid cols-3">
          {list.map((item) => (
            <ItemCard key={item.id} item={item} canManage={canManage(item)} onSuggest={setSuggest} onDelete={remove}
              onStatus={admin ? setStatus : undefined} />
          ))}
        </div>
      )}

      {form && <ItemForm itemType={form} onClose={() => setForm(null)} onSaved={() => { setForm(null); setTab(form); reloadAll(); pushToast({ title: 'Item saved', message: 'Your report was submitted.', tone: 'success' }); }} />}
      {suggest && <Suggestions item={suggest} onClose={() => setSuggest(null)} onProposed={() => { setSuggest(null); setTab('MATCHES'); reloadAll(); }} />}
    </div>
  );
}

export default function LostFound() {
  return <LostFoundBoard />;
}
