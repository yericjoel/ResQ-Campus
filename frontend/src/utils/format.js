const timeFmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const weekdayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const fullFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** "Today · 09:12 AM", "Yesterday · 05:40 PM", "Mon · 01:15 PM", "12 Oct · 11:02 AM" */
export function formatWhen(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  const time = timeFmt.format(date);
  if (days === 0) return `Today · ${time}`;
  if (days === 1) return `Yesterday · ${time}`;
  if (days > 1 && days < 7) return `${weekdayFmt.format(date)} · ${time}`;
  return `${dayFmt.format(date)} · ${time}`;
}

export function formatDateTime(iso) {
  return iso ? fullFmt.format(new Date(iso)) : '';
}

export function formatDate(value) {
  return value ? dayFmt.format(new Date(value)) : '';
}

export function formatTime(iso) {
  return iso ? timeFmt.format(new Date(iso)) : '';
}

/** Value for <input type="datetime-local"> in the user's local time. */
export function toLocalInputValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function todayInputValue() {
  return toLocalInputValue().slice(0, 10);
}

export function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
