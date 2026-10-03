export default function LoadingSpinner({ message = 'Loading...', small = false }) {
  if (small) return <span className="spinner sm" role="status" aria-label={message} />;
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="spinner" />
      <span>{message}</span>
    </div>
  );
}
