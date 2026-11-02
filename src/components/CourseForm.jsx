import { useState } from 'react';
import { makeId } from '../lib/dates.js';

const emptyCourse = { name: '', department: '', code: '', section: '', professor: '', color: '#2563eb', pickColor: false };

export default function CourseForm({ initialCourse, onSave, onCancel }) {
  const isEditing = Boolean(initialCourse);
  const [form, setForm] = useState(() => initialCourse ? {
    name: initialCourse.name || '',
    department: initialCourse.department || '',
    code: initialCourse.code || '',
    section: initialCourse.section || '',
    professor: initialCourse.professor || '',
    color: initialCourse.color?.startsWith('#') ? initialCourse.color : '#2563eb',
    pickColor: initialCourse.colorSource === 'custom',
  } : { ...emptyCourse });

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const course = {
      id: initialCourse?.id || makeId(),
      name: form.name.trim(),
      department: form.department.trim().toUpperCase(),
      code: form.code.trim(),
      section: form.section.trim(),
      professor: form.professor.trim(),
      color: form.pickColor ? form.color : null,
      colorSource: form.pickColor ? 'custom' : 'automatic',
    };
    if ([course.name, course.department, course.code, course.section, course.professor].some((v) => !v)) return;
    onSave(course);
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>Course name
        <input required maxLength={100} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Software Engineering" />
      </label>
      <div className="two-fields">
        <label>Department
          <input required maxLength={12} value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="CSCE" />
        </label>
        <label>Course code
          <input required maxLength={20} value={form.code} onChange={(e) => update('code', e.target.value)} placeholder="3444" />
        </label>
      </div>
      <label>Section
        <input required maxLength={20} value={form.section} onChange={(e) => update('section', e.target.value)} placeholder="201" />
      </label>
      <label>Professor name
        <input required maxLength={100} value={form.professor} onChange={(e) => update('professor', e.target.value)} placeholder="Dr. Smith" />
      </label>
      <fieldset className="color-fieldset">
        <legend>Course color</legend>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.pickColor} onChange={(e) => update('pickColor', e.target.checked)} />
          Choose my own color
        </label>
        {form.pickColor ? (
          <label className="color-choice">Select a color
            <input type="color" value={form.color} onChange={(e) => update('color', e.target.value)} aria-label="Course color" />
          </label>
        ) : <p className="muted small">{isEditing && initialCourse.colorSource === 'automatic'
          ? 'Your currently assigned color will be kept.'
          : 'A color not yet used by your other courses will be assigned automatically.'}</p>}
      </fieldset>
      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">{isEditing ? 'Save Changes' : 'Save Course'}</button>
      </div>
    </form>
  );
}
