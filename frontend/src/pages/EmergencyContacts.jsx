import { useMemo, useState } from 'react';
import { PhoneCall } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { contactService } from '../services/contactService';
import EmergencyContactCard from '../components/EmergencyContactCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { CONTACT_CATEGORIES, label } from '../utils/labels';

export function ContactDetails({ contact, onClose }) {
  return (
    <Modal title={contact.name} onClose={onClose}>
      <dl className="kv">
        <dt>Category</dt><dd>{label(contact.category)}</dd>
        <dt>Department</dt><dd>{contact.department || '—'}</dd>
        <dt>Designation</dt><dd>{contact.designation || '—'}</dd>
        <dt>Phone</dt><dd>{contact.phone}</dd>
        <dt>Location</dt><dd>{contact.location || '—'}</dd>
        <dt>Availability</dt><dd>{contact.availability || '—'}</dd>
      </dl>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <a className="btn btn-primary" href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}>Call {contact.phone}</a>
      </div>
    </Modal>
  );
}

export default function EmergencyContacts() {
  const { data, loading, error, reload } = useAsync(() => contactService.list(), []);
  const [category, setCategory] = useState('ALL');
  const [details, setDetails] = useState(null);

  const shown = useMemo(() => (data || []).filter((c) => category === 'ALL' || c.category === category), [data, category]);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head"><div><h1>Emergency Contacts</h1><p>Tap Call to reach the right people quickly.</p></div></div>
      <ErrorAlert message={error} onRetry={reload} />
      <div className="chips">
        <button className={`chip ${category === 'ALL' ? 'active' : ''}`} onClick={() => setCategory('ALL')}>All</button>
        {CONTACT_CATEGORIES.map((c) => (
          <button key={c.value} className={`chip ${category === c.value ? 'active' : ''}`} onClick={() => setCategory(c.value)}>{c.label}</button>
        ))}
      </div>
      {loading && !data ? <LoadingSpinner message="Loading contacts..." /> : shown.length === 0 ? (
        <div className="card"><EmptyState icon={PhoneCall} title="No contacts" message="No contacts in this category." /></div>
      ) : (
        <div className="grid cols-3">{shown.map((c) => <EmergencyContactCard key={c.id} contact={c} onDetails={setDetails} />)}</div>
      )}
      {details && <ContactDetails contact={details} onClose={() => setDetails(null)} />}
    </div>
  );
}
