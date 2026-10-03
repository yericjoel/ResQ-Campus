/** Display labels and option lists for the enums returned by the API. */

const SPECIAL = {
  MEDICAL_EMERGENCY: 'Medical Emergency',
  FIRE_RESCUE: 'Fire & Rescue',
  CAMPUS_SECURITY: 'Campus Security',
  CAMPUS_ADMINISTRATION: 'Campus Administration',
  HOSTEL_WARDEN: 'Hostel / Warden',
  IN_REVIEW: 'In Review',
};

export function label(value) {
  if (!value) return '';
  if (SPECIAL[value]) return SPECIAL[value];
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const toOptions = (values) => values.map((value) => ({ value, label: label(value) }));

export const INCIDENT_TYPES = toOptions([
  'SAFETY_HAZARD', 'MEDICAL_EMERGENCY', 'THEFT', 'HARASSMENT',
  'SUSPICIOUS_ACTIVITY', 'INFRASTRUCTURE_PROBLEM', 'OTHER',
]);
export const SEVERITIES = toOptions(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const INCIDENT_STATUSES = toOptions(['OPEN', 'IN_REVIEW', 'DISPATCHED', 'RESOLVED', 'REJECTED']);
export const CONTACT_CATEGORIES = toOptions([
  'CAMPUS_SECURITY', 'MEDICAL_EMERGENCY', 'POLICE', 'FIRE_RESCUE',
  'CAMPUS_ADMINISTRATION', 'HOSTEL_WARDEN', 'OTHER',
]);
export const ANNOUNCEMENT_CATEGORIES = toOptions(['SAFETY', 'EMERGENCY', 'CAMPUS_NOTICE', 'MAINTENANCE', 'GENERAL']);
export const ANNOUNCEMENT_PRIORITIES = toOptions(['NORMAL', 'IMPORTANT', 'CRITICAL']);
export const ROLES = toOptions(['STUDENT', 'STAFF', 'ADMIN', 'SECURITY']);

export const LOST_FOUND_CATEGORIES = [
  'Electronics', 'ID Card / Documents', 'Bags', 'Clothing', 'Accessories', 'Books', 'Keys', 'Other',
];

export const SOS_TYPES = ['Medical Assistance', 'Fire', 'Security Threat', 'Harassment', 'Other Emergency'];

export function roleDescriptor(user) {
  if (!user) return '';
  const role = label(user.role);
  return user.department ? `${role} · ${user.department}` : role;
}
