/** Where a notification should take the user when clicked. */
export function notificationTarget(n, isAdmin) {
  switch (n.type) {
    case 'SOS':
      return isAdmin ? '/admin/sos' : '/sos';
    case 'INCIDENT':
      return isAdmin ? `/admin/incidents?open=${n.referenceId ?? ''}` : n.referenceId ? `/my-reports/${n.referenceId}` : '/my-reports';
    case 'LOST_FOUND':
      return isAdmin ? '/admin/lost-found' : '/lost-found';
    case 'ANNOUNCEMENT':
      return isAdmin ? '/admin/announcements' : '/announcements';
    default:
      return isAdmin ? '/admin' : '/';
  }
}
