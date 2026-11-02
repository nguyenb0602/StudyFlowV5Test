import { useEffect, useRef, useState } from 'react';
import CalendarView from './CalendarView.jsx';
import CourseForm from './CourseForm.jsx';
import EventForm from './EventForm.jsx';
import EventsSection from './EventsSection.jsx';
import { formatDate, formatTime, todayKey } from '../lib/dates.js';
import { loadPlannerData, savePlannerData } from '../lib/storage.js';
import { eventColor, normalizeCourseColors } from '../lib/courseColors.js';
import { deleteEventRecord, eventTypeCountsForCourse, saveCourseRecord, saveEventRecord } from '../lib/plannerUpdates.js';
import { eventTypeCountLabel } from '../lib/eventTypes.js';
import { courseLabel, sortEvents } from '../lib/eventSorting.js';

function Dialog({ title, onClose, children }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return (
    <dialog ref={dialogRef} className="app-dialog" aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button type="button" className="icon-button secondary" aria-label="Close dialog" onClick={onClose}>×</button>
      </div>
      {children}
    </dialog>
  );
}

export default function Dashboard({ user, onLogout }) {
  const [data, setData] = useState(() => {
    const saved = loadPlannerData(user.email);
    return { ...saved, courses: normalizeCourseColors(saved.courses) };
  });
  const [page, setPage] = useState('Dashboard');
  const [dialog, setDialog] = useState(null);
  const [upcomingVisible, setUpcomingVisible] = useState(true);
  const { courses, events } = data;

  useEffect(() => { savePlannerData(user.email, data); }, [user.email, data]);

  function saveCourse(course) {
    setData((previous) => ({
      ...previous,
      courses: saveCourseRecord(previous.courses, course),
    }));
    setDialog(null);
  }
  function saveEvent(event) {
    setData((previous) => ({ ...previous, events: saveEventRecord(previous.events, event) }));
    setDialog(null);
  }
  function deleteCourse(id) {
    const linkedEvents = events.filter((event) => event.courseId === id).length;
    const message = linkedEvents > 0 ? `Delete this course and its ${linkedEvents} linked event(s)?` : 'Delete this course?';
    if (!window.confirm(message)) return;
    setData((previous) => ({
      courses: previous.courses.filter((course) => course.id !== id),
      events: previous.events.filter((event) => event.courseId !== id),
    }));
  }
  function deleteEvent(id) {
    if (!window.confirm('Delete this event?')) return;
    setData((previous) => ({ ...previous, events: deleteEventRecord(previous.events, id) }));
    setDialog(null);
  }
  const upcoming = sortEvents(events, 'oldest', courses)
    .filter((event) => event.date >= todayKey()).slice(0, 5);
  const selectedEvent = dialog?.kind === 'details' ? events.find((event) => event.id === dialog.id) : null;
  const editingCourse = dialog?.kind === 'course' && dialog.id ? courses.find((course) => course.id === dialog.id) : null;
  const editingEvent = dialog?.kind === 'event' && dialog.id ? events.find((event) => event.id === dialog.id) : null;
  const openDetails = (event) => setDialog({ kind: 'details', id: event.id });
  const editEvent = (event) => setDialog({ kind: 'event', id: event.id });

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">▣ StudyPlanner</div>
        <nav aria-label="Main navigation" className="side-nav">
          {['Dashboard', 'Courses', 'Events'].map((item) => (
            <button key={item} type="button" aria-current={page === item ? 'page' : undefined}
              className={`nav-link ${page === item ? 'active' : ''}`} onClick={() => setPage(item)}>{item}</button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="signed-in-label">{user.name}<span>{user.email}</span></div>
          <button type="button" className="secondary full" onClick={onLogout}>Log Out</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="main-heading">
          <div>
            <h1>{page === 'Dashboard' ? `Welcome back, ${user.name.split(' ')[0]}!` : page}</h1>
            <p className="muted">{page === 'Courses' ? 'View and manage your courses.' : page === 'Events' ? 'Browse every event and choose how to sort it.' : 'Keep track of your courses and events.'}</p>
          </div>
          <div className="top-actions">
            <button type="button" className="primary" onClick={() => setDialog({ kind: 'course' })}>+ Add Course</button>
            <button type="button" className="secondary" onClick={() => setDialog({ kind: 'event' })}>+ Add Event</button>
          </div>
        </header>

        {page === 'Courses' ? (
          <section className="section-card">
            <h2>Your Courses <span className="count">({courses.length})</span></h2>
            {courses.length === 0 ? <p className="empty-state">No courses yet. Select Add Course to create your first one.</p> : (
              <div className="course-list">
                {courses.map((course) => (
                  <article key={course.id} className="course-item">
                    <div className="course-item-info">
                      <span className="course-color-dot" style={{ background: course.color }} aria-label={`Course color ${course.color}`} />
                      <div>
                        <h3>{course.department} {course.code}: {course.name}</h3>
                        <p className="muted">Section {course.section} · {course.professor}</p>
                        <div className="course-event-counts" aria-label="Events by type">
                          {eventTypeCountsForCourse(events, course.id).map(({ type, count }) => (
                            <span className="course-event-count" key={type}>{eventTypeCountLabel(type, count)}</span>
                          ))}
                        </div>
                        <span className="muted small course-color-description">{course.colorSource === 'custom' ? 'Custom color' : 'Auto-assigned color'}</span>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button type="button" className="secondary" onClick={() => setDialog({ kind: 'course', id: course.id })} aria-label={`Edit ${course.department} ${course.code}`}>Edit</button>
                      <button type="button" className="danger-text" onClick={() => deleteCourse(course.id)} aria-label={`Delete ${course.department} ${course.code}`}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : page === 'Events' ? (
          <EventsSection events={events} courses={courses} onEventClick={openDetails} onEditEvent={editEvent} onDeleteEvent={deleteEvent} />
        ) : (
          <>
            <div className="dashboard-secondary-actions">
              <button type="button" className="secondary sidebar-toggle" aria-expanded={upcomingVisible}
                onClick={() => setUpcomingVisible((visible) => !visible)}>
                {upcomingVisible ? 'Hide Upcoming Events' : 'Show Upcoming Events'}
              </button>
            </div>
            <div className={`dashboard-grid ${upcomingVisible ? '' : 'sidebar-hidden'}`}>
              <CalendarView events={events} courses={courses}
                onAddOnDate={(date) => setDialog({ kind: 'event', date })}
                onEventClick={openDetails} />
              {upcomingVisible && (
                <aside className="upcoming-panel" aria-label="Upcoming Events sidebar">
                  <h2>Upcoming Events</h2>
                  {upcoming.length === 0 ? <p className="empty-state">No upcoming events. Add one using the button above.</p> : (
                    <ul className="upcoming-list">
                      {upcoming.map((event) => (
                        <li key={event.id}>
                          <button type="button" className="upcoming-entry" onClick={() => openDetails(event)}>
                            <span className="upcoming-title"><span className="course-color-dot" style={{ background: eventColor(event, courses) }} /> <strong>{event.title}</strong></span>
                            <span>{formatDate(event.date)} · {formatTime(event.time)}</span>
                            <span>{courseLabel(event.courseId, courses)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="stats-line">
                    <span>Courses: <strong>{courses.length}</strong></span>
                    <span>Events: <strong>{events.length}</strong></span>
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
      </main>
      {dialog?.kind === 'course' && (
        <Dialog title={editingCourse ? 'Edit Course' : 'Add Course'} onClose={() => setDialog(null)}>
          <CourseForm key={editingCourse?.id || 'new-course'} initialCourse={editingCourse} onSave={saveCourse} onCancel={() => setDialog(null)} />
        </Dialog>
      )}
      {dialog?.kind === 'event' && (
        <Dialog title={editingEvent ? 'Edit Event' : 'Add Event'} onClose={() => setDialog(null)}>
          <EventForm key={editingEvent?.id || `new-event-${dialog.date || ''}`} courses={courses} initialDate={dialog.date} initialEvent={editingEvent} onSave={saveEvent} onCancel={() => setDialog(null)} />
        </Dialog>
      )}
      {selectedEvent && (
        <Dialog title="Event Details" onClose={() => setDialog(null)}>
          <div className="event-details">
            <h3><span className="course-color-dot" style={{ background: eventColor(selectedEvent, courses) }} /> {selectedEvent.title}</h3>
            <p><strong>Type:</strong> {selectedEvent.type}</p>
            <p><strong>Course:</strong> {courseLabel(selectedEvent.courseId, courses)}</p>
            <p><strong>Date:</strong> {formatDate(selectedEvent.date)}</p>
            <p><strong>Time:</strong> {formatTime(selectedEvent.time)}</p>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary" onClick={() => setDialog(null)}>Close</button>
            <button type="button" className="primary" onClick={() => editEvent(selectedEvent)}>Edit Event</button>
            <button type="button" className="danger" onClick={() => deleteEvent(selectedEvent.id)}>Delete Event</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
