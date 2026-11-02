import { useState } from 'react';
import { formatDate, formatTime } from '../lib/dates.js';
import { eventColor } from '../lib/courseColors.js';
import { courseLabel, groupSortedEvents, SORT_OPTIONS } from '../lib/eventSorting.js';

export default function EventsSection({ events, courses, onEventClick, onEditEvent, onDeleteEvent }) {
  const [sort, setSort] = useState('oldest');
  const groups = groupSortedEvents(events, sort, courses);
  return (
    <section className="section-card" aria-label="All events">
      <div className="events-toolbar">
        <div>
          <h2>All Events <span className="count">({events.length})</span></h2>
          <p className="muted small">Includes past and upcoming events.</p>
        </div>
        <label className="sort-field">Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
      {events.length === 0 ? (
        <p className="empty-state">No events yet. Select Add Event to create one.</p>
      ) : groups.map((group) => (
        <div key={group.key} className="event-group">
          {group.title && <h3 className="group-heading">{group.title} <span className="count">({group.events.length})</span></h3>}
          <ul className="all-events-list">
            {group.events.map((event) => (
              <li key={event.id}>
                <div className="event-list-item">
                  <button type="button" className="event-list-row" onClick={() => onEventClick(event)}>
                    <span className="course-color-dot" style={{ background: eventColor(event, courses) }} aria-hidden="true" />
                    <span className="event-list-main">
                      <strong>{event.title}</strong>
                      <span className="muted small">{courseLabel(event.courseId, courses)} · {event.type}</span>
                    </span>
                    <span className="event-list-date">{formatDate(event.date)}<span className="muted small">{formatTime(event.time)}</span></span>
                  </button>
                  <div className="event-row-actions">
                    <button type="button" className="secondary edit-event-button" onClick={() => onEditEvent(event)} aria-label={`Edit event: ${event.title}`}>Edit</button>
                    <button type="button" className="danger-text delete-event-button" onClick={() => onDeleteEvent(event.id)} aria-label={`Delete event: ${event.title}`}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {(sort === 'type' || sort === 'course') && <p className="calendar-hint">Events within each group are ordered oldest to newest.</p>}
    </section>
  );
}
