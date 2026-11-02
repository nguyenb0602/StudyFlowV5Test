import { assignCourseColor } from './courseColors.js';
import { EVENT_TYPES } from './eventTypes.js';

// Replace existing records by their stable ID, rather than adding duplicates.
// Keeping course IDs intact keeps linked events attached to the edited course.
export function saveCourseRecord(courses, draft) {
  const previous = courses.find((course) => course.id === draft.id);
  const otherCourses = courses.filter((course) => course.id !== draft.id);

  let updated;
  if (previous?.colorSource === 'automatic' && draft.colorSource === 'automatic') {
    // If the user leaves an automatically assigned color on Auto, keep it.
    updated = { ...draft, color: previous.color, colorSource: 'automatic' };
  } else {
    // New courses get the first unused palette color. Changing a custom
    // color back to Auto also assigns an unused color (ignoring itself).
    updated = assignCourseColor(draft, otherCourses);
  }

  return previous
    ? courses.map((course) => (course.id === draft.id ? updated : course))
    : [...courses, updated];
}

export function saveEventRecord(events, draft) {
  return events.some((event) => event.id === draft.id)
    ? events.map((event) => (event.id === draft.id ? draft : event))
    : [...events, draft];
}

// Derive course counts from the latest events rather than maintaining a stale counter.
export function countEventsForCourse(events, courseId) {
  return events.filter((event) => event.courseId === courseId).length;
}

// Derive the counts for each type from live events. Types with zero events
// are omitted; no counters are persisted (so edits and deletions stay in sync).
export function eventTypeCountsForCourse(events, courseId) {
  const counts = new Map();
  for (const event of events) {
    if (event.courseId !== courseId) continue;
    const type = event.type || 'Other';
    counts.set(type, (counts.get(type) || 0) + 1);
  }

  // Display the same order as the event form; include legacy/custom types too.
  const types = [
    ...EVENT_TYPES,
    ...[...counts.keys()].filter((type) => !EVENT_TYPES.includes(type)).sort(),
  ];
  return types.filter((type) => counts.has(type))
    .map((type) => ({ type, count: counts.get(type) }));
}

export function deleteEventRecord(events, eventId) {
  return events.filter((event) => event.id !== eventId);
}
