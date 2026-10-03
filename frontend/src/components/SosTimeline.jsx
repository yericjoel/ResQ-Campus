import { Check } from 'lucide-react';
import { formatDateTime } from '../utils/format';

const STEPS = [
  { key: 'TRIGGERED', title: 'SOS sent', at: 'createdAt', text: 'Your alert reached campus security.' },
  { key: 'ACKNOWLEDGED', title: 'Acknowledged', at: 'acknowledgedAt', text: 'A security officer has seen your alert.' },
  { key: 'DISPATCHED', title: 'Help dispatched', at: 'dispatchedAt', text: 'A responder is on the way.' },
  { key: 'RESOLVED', title: 'Resolved', at: 'resolvedAt', text: 'The emergency has been closed.' },
];

/** Progress state for an SOS request (updates live through the WebSocket). */
export default function SosTimeline({ sos }) {
  if (sos.status === 'CANCELLED') {
    return <div className="alert info">This SOS request was cancelled.</div>;
  }
  const index = STEPS.findIndex((s) => s.key === sos.status);
  return (
    <ul className="timeline">
      {STEPS.map((step, i) => {
        const state = i < index || (i === index && sos.status === 'RESOLVED') ? 'done' : i === index ? 'current' : 'pending';
        return (
          <li key={step.key} className={state}>
            <span className="dot">{state === 'done' && <Check size={12} />}</span>
            <span>
              <strong>{step.title}</strong>
              <span className="small muted" style={{ display: 'block' }}>
                {sos[step.at] ? formatDateTime(sos[step.at]) : step.text}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
