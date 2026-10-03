import { label } from '../utils/labels';

const TONES = {
  // incident
  OPEN: 'info',
  IN_REVIEW: 'warning',
  DISPATCHED: 'dark',
  RESOLVED: 'success',
  REJECTED: 'muted',
  // sos
  TRIGGERED: 'danger',
  ACKNOWLEDGED: 'warning',
  CANCELLED: 'muted',
  // lost & found
  MATCHED: 'success',
  RETURNED: 'dark',
  PENDING: 'warning',
  VERIFIED: 'success',
  // severity
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
  // announcement priority
  NORMAL: 'muted',
  IMPORTANT: 'warning',
  // lost / found type
  LOST: 'danger',
  FOUND: 'success',
};

export default function StatusBadge({ status, text }) {
  if (!status) return null;
  return <span className={`badge tone-${TONES[status] || 'muted'}`}>{text || label(status)}</span>;
}
