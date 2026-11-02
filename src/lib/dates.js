// Date-only strings are built from calendar parts to avoid UTC date shifts.
export function pad2(value) {
  return String(value).padStart(2, '0');
}

export function toDateKey(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

export function todayKey() {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatDate(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey ?? '')) return 'Unknown date';
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatTime(time) {
  if (!/^\d{2}:\d{2}$/.test(time ?? '')) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${pad2(minutes)} ${period}`;
}

export function makeId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
