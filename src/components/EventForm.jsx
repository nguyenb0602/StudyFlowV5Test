import { useState } from 'react';
import { makeId, todayKey } from '../lib/dates.js';
import { EVENT_TYPES } from '../lib/eventTypes.js';

export default function EventForm({ courses, initialDate, initialEvent, onSave, onCancel }) {
  const isEditing = Boolean(initialEvent);
  const [form, setForm] = useState(() => ({
    title: initialEvent?.title || '',
    courseId: initialEvent?.courseId || '',
    type: initialEvent?.type || 'Assignment',
    date: initialEvent?.date || initialDate || todayKey(),
    time: initialEvent?.time || '09:00',
  }));

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) return;
    onSave({ ...initialEvent, ...form, id: initialEvent?.id || makeId(), title: form.title.trim() });
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>Event title
        <input required maxLength={120} value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="Project proposal due" />
      </label>
      <label>Course (optional)
        <select value={form.courseId} onChange={(e) => update('courseId', e.target.value)}>
          <option value="">General event / no course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.department} {course.code} - {course.name}
            </option>
          ))}
        </select>
      </label>
      <label>Event type
        <select value={form.type} onChange={(e) => update('type', e.target.value)}>
          {EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </label>
      <div className="two-fields">
        <label>Date
          <input required type="date" value={form.date}
            onChange={(e) => update('date', e.target.value)} />
        </label>
        <label>Time
          <input required type="time" value={form.time}
            onChange={(e) => update('time', e.target.value)} />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">{isEditing ? 'Save Changes' : 'Save Event'}</button>
      </div>
    </form>
  );
}
