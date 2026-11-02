// Shared event types used in the event form and on course summary labels.
export const EVENT_TYPES = ['Assignment', 'Exam', 'Study Session', 'Meeting', 'Other'];

export function eventTypeCountLabel(type, count) {
  const name = type === 'Other' ? 'Other event' : type;
  return `${count} ${name}${count === 1 ? '' : 's'}`;
}
