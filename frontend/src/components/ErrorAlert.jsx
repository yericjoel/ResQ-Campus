import { AlertCircle } from 'lucide-react';

export default function ErrorAlert({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert error" role="alert">
      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <div className="grow">{message}</div>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
