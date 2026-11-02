export const SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest to newest' },
  { value: 'newest', label: 'Newest to oldest' },
  { value: 'type', label: 'Event type' },
  { value: 'course', label: 'Course / class' },
];

export function courseLabel(courseId, courses) {
  const course = courses.find((item) => item.id === courseId);
  return course ? `${course.department} ${course.code} - ${course.name}` : 'General';
}

function chronological(a, b) {
  return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`) ||
    a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
}

export function sortEvents(events, sort, courses) {
  return [...events].sort((a, b) => {
    if (sort === 'newest') return -chronological(a, b);
    if (sort === 'type') {
      return a.type.localeCompare(b.type) || chronological(a, b);
    }
    if (sort === 'course') {
      // Keep general events last. Within each course, sort oldest first.
      if (!a.courseId && b.courseId) return 1;
      if (a.courseId && !b.courseId) return -1;
      return courseLabel(a.courseId, courses).localeCompare(courseLabel(b.courseId, courses)) ||
        a.courseId.localeCompare(b.courseId) || chronological(a, b);
    }
    return chronological(a, b);
  });
}

export function groupSortedEvents(events, sort, courses) {
  const sorted = sortEvents(events, sort, courses);
  if (sort !== 'type' && sort !== 'course') return [{ key: 'all', title: '', events: sorted }];
  const groups = [];
  for (const event of sorted) {
    const key = sort === 'type' ? event.type : (event.courseId || 'general');
    const title = sort === 'type' ? event.type : courseLabel(event.courseId, courses);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.events.push(event);
    else groups.push({ key, title, events: [event] });
  }
  return groups;
}
