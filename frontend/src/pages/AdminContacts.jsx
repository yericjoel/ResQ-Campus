import { useState } from 'react';
import { Plus, PhoneCall } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { contactService } from '../services/contactService';
import { getErrorMessage } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import EmergencyContactCard from '../components/EmergencyContactCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { ContactDetails } from './EmergencyContacts';
import { CONTACT_CATEGORIES } from '../utils/labels';

const BLANK = { name: '', department: '', designation: '', category: 'CAMPUS_SECURITY', phone: '', location: '', availability: '', active: true };

function ContactForm({ contact, onClose, onSaved }) {
  const [f, setF] = useState(contact ? { ...BLANK, ...contact } : BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = { name: f.name, department: f.department, designation: f.designation, category: f.category, phone: f.phone,
      location: f.location, availability: f.availability, active: f.active };
    try {
      if (contact) await contactService.update(contact.id, body); else await contactService.create(body);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={contact ? 'Edit contact' : 'Add contact'} onClose={onClose} locked={busy} wide>
      <form className="stack" onSubmit={submit}>
        <ErrorAlert message={error} />
        <div className="form-grid">
          <div className="field"><label>Name</label><input className="input" required value={f.name} onChange={set('name')} /></div>
          <div className="field"><label>Category</label>
            <select className="input" value={f.category} onChange={set('category')}>{CONTACT_CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="field"><label>Department</label><input className="input" value={f.department} onChange={set('department')} /></div>
          <div className="field"><label>Designation</label><input className="input" value={f.designation} onChange={set('designation')} /></div>
          <div className="field"><label>Phone</label><input className="input" required value={f.phone} onChange={set('phone')} /></div>
          <div className="field"><label>Location</label><input className="input" value={f.location} onChange={set('location')} /></div>
          <div className="field full"><label>Availability</label><input className="input" value={f.availability} onChange={set('availability')} placeholder="e.g. 24/7" /></div>
          <label className="row full" style={{ gridColumn: '1 / -1' }}><input type="checkbox" checked={f.active} onChange={(e) => setF((v) => ({ ...v, active: e.target.checked }))} /> Active (visible to students)</label>
        </div>
        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save contact'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminContacts() {
  const { pushToast } = useNotifications();
  const { data, loading, error, reload } = useAsync(() => contactService.list(), []);
  const [form, setForm] = useState(null); // null | 'new' | contact
  const [details, setDetails] = useState(null);
  const [err, setErr] = useState('');

  const toggle = async (c) => {
    try {
      await contactService.update(c.id, { ...c, active: !c.active });
      reload();
    } catch (e) { setErr(getErrorMessage(e)); }
  };
  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name}?`)) return;
    try { await contactService.remove(c.id); reload(); } catch (e) { setErr(getErrorMessage(e)); }
  };

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <div><h1>Emergency Contacts</h1><p>Add, edit, categorize and activate contacts shown to students.</p></div>
        <button className="btn btn-primary" onClick={() => setForm('new')}><Plus size={16} /> Add contact</button>
      </div>
      <ErrorAlert message={error || err} onRetry={reload} />
      {loading && !data ? <LoadingSpinner message="Loading contacts..." /> : !data?.length ? (
        <div className="card"><EmptyState icon={PhoneCall} title="No contacts yet" message="Add the first emergency contact." /></div>
      ) : (
        <div className="grid cols-3">
          {data.map((c) => <EmergencyContactCard key={c.id} contact={c} admin onDetails={setDetails} onEdit={setForm} onToggle={toggle} onDelete={remove} />)}
        </div>
      )}
      {form && <ContactForm contact={form === 'new' ? null : form} onClose={() => setForm(null)}
        onSaved={() => { setForm(null); reload(); pushToast({ title: 'Contact saved', message: 'Students see the change immediately.', tone: 'success' }); }} />}
      {details && <ContactDetails contact={details} onClose={() => setDetails(null)} />}
    </div>
  );
}
