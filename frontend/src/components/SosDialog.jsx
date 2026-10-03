import { useEffect, useState } from 'react';
import { Siren, MapPin } from 'lucide-react';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';
import StatusBadge from './StatusBadge';
import SosTimeline from './SosTimeline';
import { sosService } from '../services/sosService';
import { getErrorMessage } from '../services/api';
import { useRealtime } from '../context/NotificationContext';
import { SOS_TYPES } from '../utils/labels';

const ACTIVE = ['TRIGGERED', 'ACKNOWLEDGED', 'DISPATCHED'];

/** One-step SOS: confirm, send, then follow the live status. */
export default function SosDialog({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);
  const [type, setType] = useState(SOS_TYPES[0]);
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    sosService.mine()
      .then((list) => setActive(list.find((s) => ACTIVE.includes(s.status)) || null))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
    // Use the device location when the user allows it; typing a place also works.
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {},
      { timeout: 6000 },
    );
  }, []);

  useRealtime('sos', (payload) => {
    if (payload?.sos && active && payload.sos.id === active.id) setActive(payload.sos);
  });

  const send = async () => {
    setSending(true);
    setError('');
    try {
      const created = await sosService.create({ type, location: location.trim() || undefined, ...(coords || {}) });
      setActive(created);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not send your SOS. Please call campus security directly.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title={active ? 'Your SOS' : 'Send Emergency SOS'} onClose={onClose} locked={sending}>
      {loading ? (
        <LoadingSpinner message="Checking SOS status..." />
      ) : active ? (
        <div className="stack">
          <div className="row between">
            <strong>{active.sosId}</strong>
            <StatusBadge status={active.status} />
          </div>
          <SosTimeline sos={active} />
          {!ACTIVE.includes(active.status) && <p className="small muted">This request is closed.</p>}
          <div className="modal-actions"><button className="btn btn-secondary" onClick={onClose}>Close</button></div>
        </div>
      ) : (
        <div className="stack">
          <div className="alert error" style={{ alignItems: 'center' }}>
            <Siren size={20} />
            <div>
              <strong>This alert is sent immediately to authorized campus security personnel.</strong>
              <div className="small">Use it only for real emergencies.</div>
            </div>
          </div>
          <div className="field">
            <label htmlFor="sos-type">Type of emergency</label>
            <select id="sos-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {SOS_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sos-loc">Where are you? (optional)</label>
            <input id="sos-loc" className="input" placeholder="e.g. Hostel B, 2nd floor" value={location}
              onChange={(e) => setLocation(e.target.value)} maxLength={200} />
            {coords && <span className="xsmall row" style={{ gap: 4 }}><MapPin size={12} /> Device location will be included</span>}
          </div>
          <ErrorAlert message={error} />
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onClose} disabled={sending}>Cancel</button>
            <button className="btn btn-primary" onClick={send} disabled={sending}>
              {sending ? 'Sending SOS...' : 'Send SOS now'}
            </button>
          </div>
        </div>
      )}
      {active && error && <ErrorAlert message={error} />}
    </Modal>
  );
}
