import { Phone, Info, MapPin, Clock, Pencil, Trash2, Power } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { label } from '../utils/labels';

/** admin: shows management buttons (edit, activate/deactivate, delete). */
export default function EmergencyContactCard({ contact, onDetails, admin = false, onEdit, onToggle, onDelete }) {
  const tel = `tel:${contact.phone.replace(/[^\d+]/g, '')}`;
  return (
    <div className="card contact-card" style={contact.active ? undefined : { opacity: 0.7 }}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 16 }}>{contact.name}</h3>
          <p className="small muted">
            {[contact.designation, contact.department].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="badge tone-dark">{label(contact.category)}</span>
      </div>
      <div className="small muted stack" style={{ gap: 4 }}>
        <span className="row"><Phone size={14} /> {contact.phone}</span>
        {contact.location && <span className="row"><MapPin size={14} /> {contact.location}</span>}
        {contact.availability && <span className="row"><Clock size={14} /> {contact.availability}</span>}
      </div>
      {admin && !contact.active && <StatusBadge status="REJECTED" text="Inactive" />}
      <div className="row wrap">
        <a href={tel} className="btn btn-primary btn-sm"><Phone size={15} /> Call</a>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDetails(contact)}>
          <Info size={15} /> View Details
        </button>
        {admin && (
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(contact)}><Pencil size={14} /> Edit</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onToggle(contact)}>
              <Power size={14} /> {contact.active ? 'Deactivate' : 'Activate'}
            </button>
            <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => onDelete(contact)}><Trash2 size={14} /> Delete</button>
          </>
        )}
      </div>
    </div>
  );
}
