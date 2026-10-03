export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty-icon">
          <Icon size={26} />
        </div>
      )}
      {title && <strong style={{ color: 'var(--text)' }}>{title}</strong>}
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
