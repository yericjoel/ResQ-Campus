import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ImagePlus, CheckCircle2 } from 'lucide-react';
import { incidentService } from '../services/incidentService';
import { getErrorMessage } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import { INCIDENT_TYPES, SEVERITIES } from '../utils/labels';
import { toLocalInputValue } from '../utils/format';

const MAX_MB = 5;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ReportIncident() {
  const navigate = useNavigate();
  const [f, setF] = useState({ type: 'SAFETY_HAZARD', title: '', description: '', location: '', incidentDate: toLocalInputValue(), severity: 'MEDIUM' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!OK_TYPES.includes(file.type)) return setError('Photo must be a JPG, PNG or WebP image.');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Photo must be smaller than ${MAX_MB} MB.`);
    setError('');
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const created = await incidentService.create({ ...f, incidentDate: new Date(f.incidentDate).toISOString() }, photo);
      setDone(created);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit your report.'));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="card center stack" style={{ alignItems: 'center', maxWidth: 520, margin: '40px auto', padding: 36 }}>
        <CheckCircle2 size={48} color="var(--success)" />
        <h2>Report submitted</h2>
        <p className="muted">Your report ID is <strong>{done.reportId}</strong> and its status is <strong>Open</strong>. Campus security has been notified.</p>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate(`/my-reports/${done.id}`)}>View report</button>
          <Link className="btn btn-secondary" to="/my-reports">My Reports</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head"><div><h1>Report Incident</h1><p>Tell us what happened. For an emergency use SOS instead.</p></div></div>
      <form className="card stack" onSubmit={submit} style={{ maxWidth: 820 }}>
        <ErrorAlert message={error} />
        <div className="form-grid">
          <div className="field"><label>Incident type</label>
            <select className="input" value={f.type} onChange={set('type')}>{INCIDENT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="field"><label>Severity</label>
            <select className="input" value={f.severity} onChange={set('severity')}>{SEVERITIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="field full"><label>Title</label><input className="input" required maxLength={150} value={f.title} onChange={set('title')} placeholder="Short summary" /></div>
          <div className="field full"><label>Description</label><textarea className="textarea" required value={f.description} onChange={set('description')} placeholder="What happened? Who was involved?" /></div>
          <div className="field"><label>Location</label><input className="input" required value={f.location} onChange={set('location')} placeholder="e.g. Hostel B corridor" /></div>
          <div className="field"><label>Date &amp; time</label><input className="input" type="datetime-local" required max={toLocalInputValue()} value={f.incidentDate} onChange={set('incidentDate')} /></div>
          <div className="field full">
            <label>Photo evidence (optional)</label>
            <div className="upload">
              {preview ? <img src={preview} alt="Selected evidence" /> : <ImagePlus size={28} color="var(--text-3)" />}
              <div className="grow small muted">{photo ? photo.name : `JPG, PNG or WebP, up to ${MAX_MB} MB`}</div>
              <input type="file" accept={OK_TYPES.join(',')} onChange={pick} aria-label="Photo evidence" />
            </div>
          </div>
        </div>
        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting report...' : 'Submit report'}</button>
        </div>
      </form>
    </div>
  );
}
