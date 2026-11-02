import { useState } from 'react';
import { todayKey, toDateKey, formatDate, formatTime } from '../lib/dates.js';
import { eventColor } from '../lib/courseColors.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dateAt = (year, month, day) => new Date(year, month, day);
const dateKey = (d) => toDateKey(d.getFullYear(), d.getMonth(), d.getDate());

function shift(date, days) {
  return dateAt(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function DayEvents({ date, items, courses, onEventClick, onAddOnDate, compact = false }) {
  return (
    <div className={`calendar-day ${date === todayKey() ? 'today-cell' : ''} ${compact ? 'compact-day' : ''}`}>
      <button type="button" className="day-number" title={`Add event on ${date}`}
        aria-label={`Add event on ${date}`} onClick={() => onAddOnDate(date)}>
        {Number(date.slice(-2))}
      </button>
      {items.map((event) => (
        <button key={event.id} type="button" className="calendar-event" title={`${formatTime(event.time)} — ${event.title}`}
          style={{ '--event-color': eventColor(event, courses) }} onClick={() => onEventClick(event)}>
          {!compact && <span className="event-time-prefix">{formatTime(event.time)} · </span>}{event.title}
        </button>
      ))}
    </div>
  );
}

export default function CalendarView({ events, courses, onAddOnDate, onEventClick }) {
  const [view, setView] = useState('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const year = anchor.getFullYear();
  const monthIndex = anchor.getMonth();
  const today = todayKey();
  const byDate = new Map();
  events.forEach((event) => {
    if (!byDate.has(event.date)) byDate.set(event.date, []);
    byDate.get(event.date).push(event);
  });
  byDate.forEach((items) => items.sort((a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title)));

  const weekStart = shift(anchor, -anchor.getDay());
  const weekEnd = shift(weekStart, 6);
  const heading = view === 'month'
    ? anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : view === 'week'
      ? `${formatDate(dateKey(weekStart))} – ${formatDate(dateKey(weekEnd))}`
      : anchor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  function navigate(direction) {
    if (view === 'month') setAnchor(dateAt(year, monthIndex + direction, 1));
    else setAnchor(shift(anchor, direction * (view === 'week' ? 7 : 1)));
  }

  function switchView(nextView) {
    setView(nextView);
  }

  const firstDay = dateAt(year, monthIndex, 1).getDay();
  const numberOfDays = dateAt(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + numberOfDays) / 7) * 7;
  const focusedDays = view === 'week'
    ? Array.from({ length: 7 }, (_, i) => shift(weekStart, i))
    : [anchor];

  return (
    <section className="calendar-panel" aria-label="StudyPlanner calendar">
      <header className="calendar-heading">
        <div className="calendar-heading-text">
          <h2>{heading}</h2>
          <div className="calendar-view-switch" role="group" aria-label="Calendar view">
            {['month', 'week', 'day'].map((option) => (
              <button key={option} type="button" className={`view-button ${view === option ? 'selected' : ''}`}
                aria-pressed={view === option} onClick={() => switchView(option)}>
                {option[0].toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="calendar-controls">
          <button type="button" className="secondary small-button" onClick={() => setAnchor(new Date())}>Today</button>
          <button type="button" className="secondary icon-button" aria-label={`Previous ${view}`} onClick={() => navigate(-1)}>‹</button>
          <button type="button" className="secondary icon-button" aria-label={`Next ${view}`} onClick={() => navigate(1)}>›</button>
        </div>
      </header>

      {view === 'month' ? (
        <div className="calendar-grid" role="group" aria-label="Month view">
          {DAY_LABELS.map((day) => <div key={day} className="weekday">{day}</div>)}
          {Array.from({ length: totalCells }, (_, i) => {
            const day = i - firstDay + 1;
            if (day < 1 || day > numberOfDays) return <div key={`empty-${i}`} className="calendar-day empty" />;
            const date = toDateKey(year, monthIndex, day);
            const dayEvents = byDate.get(date) || [];
            return (
              <div key={date} className={`calendar-day ${today === date ? 'today-cell' : ''}`}>
                <button type="button" className="day-number" aria-label={`Add event on ${date}`}
                  title="Add event" onClick={() => onAddOnDate(date)}>{day}</button>
                {dayEvents.slice(0, 2).map((event) => (
                  <button type="button" key={event.id} className="calendar-event" title={`${formatTime(event.time)} — ${event.title}`}
                    style={{ '--event-color': eventColor(event, courses) }} onClick={() => onEventClick(event)}>
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <button type="button" className="more-events" onClick={() => { setAnchor(dateAt(year, monthIndex, day)); setView('day'); }}>
                    +{dayEvents.length - 2} more
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`focused-calendar ${view === 'week' ? 'week-calendar' : 'single-day-calendar'}`} role="group" aria-label={`${view} view`}>
          {focusedDays.map((date) => {
            const key = dateKey(date);
            const items = byDate.get(key) || [];
            return (
              <div key={key} className="focused-day">
                <h3>{date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
                <DayEvents date={key} items={items} courses={courses} onEventClick={onEventClick} onAddOnDate={onAddOnDate} />
                {items.length === 0 && <p className="muted small empty-day">No events</p>}
              </div>
            );
          })}
        </div>
      )}
      <p className="calendar-hint">Select a date number to add an event. Select an event for details. Colors follow courses; general events are gray.</p>
    </section>
  );
}
