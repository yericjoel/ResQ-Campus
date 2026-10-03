import Modal from './Modal';
import SosTimeline from './SosTimeline';
import StatusBadge from './StatusBadge';
import { label } from '../utils/labels';

export default function SosDetailsModal({ sos, onClose }) {
  return (
    <Modal title={`SOS ${sos.sosId}`} onClose={onClose} wide>
      <div className="stack">
        <div className="row between"><strong>{sos.userName}</strong><StatusBadge status={sos.status} /></div>
        <dl className="kv">
          <dt>Role</dt><dd>{label(sos.userRole)}{sos.department ? ` · ${sos.department}` : ''}</dd>
          <dt>Phone</dt><dd>{sos.userPhone ? <a href={`tel:${sos.userPhone}`}>{sos.userPhone}</a> : '—'}</dd>
          <dt>Emergency contact</dt><dd>{sos.emergencyContactName ? `${sos.emergencyContactName} (${sos.emergencyContactPhone || 'no number'})` : '—'}</dd>
          <dt>Location</dt><dd>{sos.location || '—'}{sos.latitude ? ` (${sos.latitude.toFixed(5)}, ${sos.longitude.toFixed(5)})` : ''}</dd>
          <dt>Type</dt><dd>{sos.type || 'Emergency'}</dd>
          <dt>Acknowledged by</dt><dd>{sos.acknowledgedByName || '—'}</dd>
          <dt>Dispatched by</dt><dd>{sos.dispatchedByName || '—'}</dd>
          <dt>Resolved by</dt><dd>{sos.resolvedByName || '—'}</dd>
        </dl>
        <SosTimeline sos={sos} />
        <div className="modal-actions" style={{ marginTop: 0 }}><button className="btn btn-secondary" onClick={onClose}>Close</button></div>
      </div>
    </Modal>
  );
}
