// Course colors are stored on courses, never derived from event types.
export const COURSE_PALETTE = [
  '#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#0891b2',
  '#be185d', '#65a30d', '#4f46e5', '#0f766e', '#b45309', '#9333ea',
  '#475569', '#0284c7', '#c2410c', '#15803d',
];
export const GENERAL_EVENT_COLOR = '#64748b';

function validColor(color) {
  return typeof color === 'string' &&
    (/^#[a-f\d]{6}$/i.test(color) || /^hsl\(\d{1,3} 65% 43%\)$/.test(color));
}

export function unusedCourseColor(courses) {
  const used = new Set(courses.map((course) => (course.color || '').toLowerCase()));
  for (const color of COURSE_PALETTE) {
    if (!used.has(color.toLowerCase())) return color;
  }
  // Extend beyond the preset palette, checking for an unused color.
  for (let hue = 0; hue < 360; hue++) {
    const color = `hsl(${hue} 65% 43%)`;
    if (!used.has(color.toLowerCase())) return color;
  }
  // Practically unreachable unless there are hundreds of courses.
  return '#334155';
}

export function assignCourseColor(course, existingCourses) {
  if (course.colorSource === 'custom' && /^#[a-f\d]{6}$/i.test(course.color || '')) {
    return { ...course, color: course.color.toLowerCase(), colorSource: 'custom' };
  }
  return { ...course, color: unusedCourseColor(existingCourses), colorSource: 'automatic' };
}

// Old saved courses have no color. Assign distinct colors once and persist them.
export function normalizeCourseColors(courses) {
  // Reserve already-assigned colors first, even when legacy courses appear
  // earlier in the array than courses with custom colors.
  const reserved = courses.filter((course) => validColor(course.color));
  const resolved = [];
  for (const course of courses) {
    if (validColor(course.color)) {
      resolved.push(course);
    } else {
      const assigned = assignCourseColor(course, [...reserved, ...resolved]);
      resolved.push(assigned);
      reserved.push(assigned);
    }
  }
  return resolved;
}

export function eventColor(event, courses) {
  return courses.find((course) => course.id === event.courseId)?.color || GENERAL_EVENT_COLOR;
}
