import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatTime, toDateKey } from '../src/lib/dates.js';
import {
  addAccount, getAccounts, setActiveUser, getActiveUser,
  savePlannerData, loadPlannerData,
} from '../src/lib/storage.js';

const backing = new Map();
globalThis.localStorage = {
  getItem: (key) => backing.get(key) ?? null,
  setItem: (key, value) => backing.set(key, value),
  removeItem: (key) => backing.delete(key),
};

test('date helper creates local calendar keys', () => {
  assert.equal(toDateKey(2026, 9, 25), '2026-10-25');
  assert.equal(formatTime('14:30'), '2:30 PM');
  assert.ok(formatDate('2026-10-25').includes('2026'));
});

test('demo profiles can be saved and signed out', () => {
  addAccount({ name: 'Jamie', email: 'jamie@example.com' });
  assert.equal(getAccounts()[0].name, 'Jamie');
  setActiveUser(getAccounts()[0]);
  assert.equal(getActiveUser().email, 'jamie@example.com');
  setActiveUser(null);
  assert.equal(getActiveUser(), null);
});

test('separate browser profiles use separate planner data keys', () => {
  savePlannerData('jamie@example.com', { courses: [{ id: 'a' }], events: [] });
  assert.equal(loadPlannerData('jamie@example.com').courses.length, 1);
  assert.equal(loadPlannerData('someone@example.com').courses.length, 0);
});

import { COURSE_PALETTE, assignCourseColor, eventColor, normalizeCourseColors } from '../src/lib/courseColors.js';
import { groupSortedEvents, sortEvents } from '../src/lib/eventSorting.js';
import { passwordChecks, validatePassword } from '../src/lib/password.js';

const sampleCourses = [
  { id: 'a', department: 'CSCE', code: '3444', name: 'Software Engineering', color: '#2563eb' },
  { id: 'b', department: 'MATH', code: '1710', name: 'Calculus', color: '#059669' },
];
const sampleEvents = [
  { id: '1', title: 'Exam late', date: '2026-11-20', time: '12:00', type: 'Exam', courseId: 'a' },
  { id: '2', title: 'Study early', date: '2026-11-03', time: '12:00', type: 'Study Session', courseId: 'b' },
  { id: '3', title: 'Exam early', date: '2026-11-04', time: '08:00', type: 'Exam', courseId: 'a' },
  { id: '4', title: 'Study late', date: '2026-11-10', time: '12:00', type: 'Study Session', courseId: 'a' },
  { id: '5', title: 'General', date: '2026-11-01', time: '07:00', type: 'Assignment', courseId: '' },
];

test('oldest and newest options order by event date and time', () => {
  assert.deepEqual(sortEvents(sampleEvents, 'oldest', sampleCourses).map(e => e.id), ['5', '2', '3', '4', '1']);
  assert.deepEqual(sortEvents(sampleEvents, 'newest', sampleCourses).map(e => e.id), ['1', '4', '3', '2', '5']);
});

test('sort by event type groups alphabetically, each group oldest first', () => {
  const groups = groupSortedEvents(sampleEvents, 'type', sampleCourses);
  assert.deepEqual(groups.map(group => group.title), ['Assignment', 'Exam', 'Study Session']);
  assert.deepEqual(groups.find(group => group.title === 'Exam').events.map(e => e.id), ['3', '1']);
  assert.deepEqual(groups.find(group => group.title === 'Study Session').events.map(e => e.id), ['2', '4']);
});

test('sort by course groups classes chronologically, general events last', () => {
  const groups = groupSortedEvents(sampleEvents, 'course', sampleCourses);
  assert.deepEqual(groups.map(group => group.key), ['a', 'b', 'general']);
  assert.deepEqual(groups[0].events.map(e => e.id), ['3', '4', '1']);
});

test('auto assigned course color does not reuse an existing color', () => {
  const assigned = assignCourseColor({ id: 'c', name: 'Chemistry', color: null, colorSource: 'automatic' }, sampleCourses);
  assert.equal(assigned.color, COURSE_PALETTE[2]);
  assert.equal(assigned.colorSource, 'automatic');
  assert.equal(eventColor({ courseId: 'c' }, [...sampleCourses, assigned]), assigned.color);
});

test('user-selected color is preserved and older courses are migrated', () => {
  const custom = assignCourseColor({ id: 'c', color: '#ff0099', colorSource: 'custom' }, sampleCourses);
  assert.equal(custom.color, '#ff0099');
  const migrated = normalizeCourseColors([{ id: 'x' }, { id: 'y' }]);
  assert.notEqual(migrated[0].color, migrated[1].color);
  const withCustomLater = normalizeCourseColors([{ id: 'old' }, { id: 'custom', color: COURSE_PALETTE[0], colorSource: 'custom' }]);
  assert.notEqual(withCustomLater[0].color, withCustomLater[1].color);
});

test('sign-up password requires only a minimum of 10 characters', () => {
  assert.match(validatePassword('123456789'), /10/);
  assert.equal(validatePassword('1234567890'), '');
  assert.equal(validatePassword('abcdefghij'), '');
  assert.equal(validatePassword('longer than ten'), '');
  assert.equal(passwordChecks('1234567890').length, 1);
  assert.ok(passwordChecks('1234567890')[0].passed);
});

import { countEventsForCourse, deleteEventRecord, eventTypeCountsForCourse, saveCourseRecord, saveEventRecord } from '../src/lib/plannerUpdates.js';

test('editing a course keeps its ID and linked events, without adding a duplicate', () => {
  const original = { id: 'csce-1', name: 'Software Engineering', department: 'CSCE', code: '3444', section: '201', professor: 'Dr. Smith', color: COURSE_PALETTE[0], colorSource: 'automatic' };
  const linkedEvents = [{ id: 'event-1', courseId: 'csce-1', title: 'Final', date: '2026-11-10', time: '10:00', type: 'Exam' }];
  const courses = saveCourseRecord([original], { ...original, name: 'Software Engineering II', professor: 'Dr. Lee', color: null });
  assert.equal(courses.length, 1);
  assert.equal(courses[0].id, original.id);
  assert.equal(courses[0].name, 'Software Engineering II');
  assert.equal(courses[0].color, original.color);
  assert.equal(linkedEvents[0].courseId, courses[0].id);
  assert.equal(eventColor(linkedEvents[0], courses), original.color);
});

test('editing a course color updates event color and switching to auto chooses unused color', () => {
  const original = { ...sampleCourses[0], colorSource: 'custom' };
  const customUpdate = saveCourseRecord([original, { ...sampleCourses[1], colorSource: 'automatic' }], { ...original, color: '#ee4488' });
  assert.equal(eventColor({ courseId: 'a' }, customUpdate), '#ee4488');
  const automaticUpdate = saveCourseRecord(customUpdate, { ...customUpdate[0], color: null, colorSource: 'automatic' });
  assert.equal(automaticUpdate[0].colorSource, 'automatic');
  assert.notEqual(automaticUpdate[0].color, automaticUpdate[1].color);
  assert.equal(eventColor({ courseId: 'a' }, automaticUpdate), automaticUpdate[0].color);
});

test('editing an event updates its date, time, type and course with same ID', () => {
  const original = sampleEvents[0];
  const edited = { ...original, title: 'Rescheduled exam', date: '2026-12-02', time: '15:30', type: 'Meeting', courseId: 'b' };
  const saved = saveEventRecord(sampleEvents, edited);
  assert.equal(saved.length, sampleEvents.length);
  assert.equal(saved.find((event) => event.id === original.id).title, 'Rescheduled exam');
  assert.equal(saved.find((event) => event.id === original.id).date, '2026-12-02');
  assert.equal(saved.find((event) => event.id === original.id).courseId, 'b');
  assert.deepEqual(sortEvents(saved, 'newest', sampleCourses).map((event) => event.id)[0], original.id);
});

test('adding through the same save functions appends new course and event', () => {
  const course = saveCourseRecord(sampleCourses, { id: 'c', name: 'History', colorSource: 'automatic', color: null });
  const events = saveEventRecord(sampleEvents, { id: '6', title: 'Quiz', type: 'Exam', date: '2026-11-30', time: '09:00', courseId: 'c' });
  assert.equal(course.length, sampleCourses.length + 1);
  assert.equal(events.length, sampleEvents.length + 1);
  assert.ok(course[2].color);
  assert.equal(events[5].id, '6');
});


test('course event count updates for additions, deletion, and reassignment', () => {
  const first = [{ id: 'e1', courseId: 'a', title: 'One' }, { id: 'e2', courseId: 'a', title: 'Two' }];
  assert.equal(countEventsForCourse(first, 'a'), 2);
  assert.equal(countEventsForCourse(first, 'b'), 0);
  const added = saveEventRecord(first, { id: 'e3', courseId: 'a', title: 'Three' });
  assert.equal(countEventsForCourse(added, 'a'), 3);
  const removed = deleteEventRecord(added, 'e2');
  assert.equal(countEventsForCourse(removed, 'a'), 2);
  const reassigned = saveEventRecord(removed, { id: 'e3', courseId: 'b', title: 'Three' });
  assert.equal(countEventsForCourse(reassigned, 'a'), 1);
  assert.equal(countEventsForCourse(reassigned, 'b'), 1);
});

test('delete by event ID removes only the selected record', () => {
  const next = deleteEventRecord(sampleEvents, '3');
  assert.equal(next.length, sampleEvents.length - 1);
  assert.equal(next.some((event) => event.id === '3'), false);
  assert.ok(next.some((event) => event.id === '1'));
});

import { eventTypeCountLabel } from '../src/lib/eventTypes.js';

test('course labels include only non-zero event types in event-form order', () => {
  const events = [
    { id: '1', courseId: 'a', type: 'Assignment' },
    { id: '2', courseId: 'a', type: 'Assignment' },
    { id: '3', courseId: 'a', type: 'Exam' },
    { id: '4', courseId: 'a', type: 'Exam' },
    { id: '5', courseId: 'a', type: 'Study Session' },
    { id: '6', courseId: 'b', type: 'Meeting' },
    { id: '7', courseId: '', type: 'Other' },
  ];
  assert.deepEqual(eventTypeCountsForCourse(events, 'a'), [
    { type: 'Assignment', count: 2 },
    { type: 'Exam', count: 2 },
    { type: 'Study Session', count: 1 },
  ]);
  assert.deepEqual(eventTypeCountsForCourse(events, 'missing'), []);
  assert.deepEqual(eventTypeCountsForCourse(events, 'b'), [{ type: 'Meeting', count: 1 }]);
  assert.deepEqual(eventTypeCountsForCourse(events, ''), [{ type: 'Other', count: 1 }]);
  assert.equal(eventTypeCountLabel('Assignment', 2), '2 Assignments');
  assert.equal(eventTypeCountLabel('Exam', 1), '1 Exam');
  assert.equal(eventTypeCountLabel('Study Session', 2), '2 Study Sessions');
  assert.equal(eventTypeCountLabel('Other', 1), '1 Other event');
});

test('event type counts update when an event is added, edited, deleted, or reassigned', () => {
  const initial = [{ id: '1', courseId: 'a', type: 'Exam' }];
  const added = saveEventRecord(initial, { id: '2', courseId: 'a', type: 'Exam' });
  assert.deepEqual(eventTypeCountsForCourse(added, 'a'), [{ type: 'Exam', count: 2 }]);
  const edited = saveEventRecord(added, { id: '2', courseId: 'a', type: 'Assignment' });
  assert.deepEqual(eventTypeCountsForCourse(edited, 'a'), [
    { type: 'Assignment', count: 1 }, { type: 'Exam', count: 1 },
  ]);
  const deleted = deleteEventRecord(edited, '1');
  assert.deepEqual(eventTypeCountsForCourse(deleted, 'a'), [{ type: 'Assignment', count: 1 }]);
  const reassigned = saveEventRecord(deleted, { id: '2', courseId: 'b', type: 'Assignment' });
  assert.deepEqual(eventTypeCountsForCourse(reassigned, 'a'), []);
  assert.deepEqual(eventTypeCountsForCourse(reassigned, 'b'), [{ type: 'Assignment', count: 1 }]);
});
