import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { getErrorMessage } from '../services/api';
import Avatar from '../components/Avatar';
import ErrorAlert from '../components/ErrorAlert';
import { roleDescriptor } from '../utils/labels';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({
    name: user.name || '', studentId: user.studentId || '', department: user.department || '', year: user.year ?? '',
    phone: user.phone || '', emergencyContactName: user.emergencyContactName || '', emergencyContactPhone: user.emergencyContactPhone || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => { setSaved(false); setF((v) => ({ ...v, [k]: e.target.value })); };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      setUser(await authService.updateProfile({ ...f, year: f.year === '' ? null : Number(f.year) }));
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError('Photo must be a JPG, PNG or WebP image.');
    if (file.size > 5 * 1024 * 1024) return setError('Photo must be smaller than 5 MB.');
    setError('');
    try {
      setUser(await authService.uploadPhoto(file));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 820 }}>
      <div className="page-head"><div><h1>Profile</h1><p>Keep your details current so responders can reach you.</p></div></div>
      <div className="card row" style={{ gap: 18 }}>
        <Avatar user={user} large />
        <div className="grow">
          <h2>{user.name}</h2>
          <p className="muted">{roleDescriptor(user)} · {user.email}</p>
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={() => fileRef.current?.click()}><Camera size={14} /> Change photo</button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} />
        </div>
        <div style={{ minWidth: 150 }}>
          <div className="small muted">Profile completion</div>
          <strong style={{ fontSize: 24 }}>{user.profileCompletion}%</strong>
        </div>
      </div>
      <form className="card stack" onSubmit={save}>
        <ErrorAlert message={error} />
        {saved && <div className="alert success">Profile saved.</div>}
        <div className="form-grid">
          <div className="field"><label>Name</label><input className="input" required value={f.name} onChange={set('name')} /></div>
          <div className="field"><label>Email</label><input className="input" value={user.email} readOnly /></div>
          <div className="field"><label>Student / Staff ID</label><input className="input" value={f.studentId} onChange={set('studentId')} /></div>
          <div className="field"><label>Department</label><input className="input" value={f.department} onChange={set('department')} /></div>
          <div className="field"><label>Year</label><input className="input" type="number" min="1" max="8" value={f.year} onChange={set('year')} /></div>
          <div className="field"><label>Phone</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
          <div className="field"><label>Emergency contact name</label><input className="input" value={f.emergencyContactName} onChange={set('emergencyContactName')} /></div>
          <div className="field"><label>Emergency contact phone</label><input className="input" value={f.emergencyContactPhone} onChange={set('emergencyContactPhone')} /></div>
        </div>
        <div className="modal-actions" style={{ marginTop: 0 }}><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </div>
  );
}
