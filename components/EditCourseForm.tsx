'use client';

import { useState } from 'react';
import { useLibrary } from './LibraryProvider';
import { useToast } from './ToastProvider';
import type { Course, Level, Semester } from '@/types/resource';

const SEMESTERS: Semester[] = [1, 2];

// Shared by /admin/courses (all levels) and /rep (levels scoped to the
// rep's own assignment) — the level select only ever offers the `levels`
// prop, so a rep can never pick a level outside their write scope in the UI
// (the server enforces the same rule regardless).
export default function EditCourseForm({
  course,
  levels,
  onDone,
}: {
  course: Course;
  levels: Level[];
  onDone: () => void;
}) {
  const { updateCourse } = useLibrary();
  const toast = useToast();
  const [code, setCode] = useState(course.code);
  const [title, setTitle] = useState(course.title);
  const [lecturer, setLecturer] = useState(course.lecturer ?? '');
  const [level, setLevel] = useState<Level>(course.level);
  const [semester, setSemester] = useState<Semester>(course.semester);
  const [touched, setTouched] = useState(false);

  const isValid = code.trim().length > 0 && title.trim().length > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    const result = await updateCourse(course.code, {
      code: code.trim(),
      title: title.trim(),
      lecturer: lecturer.trim() || undefined,
      level,
      semester,
    });
    if (!result.ok) {
      toast(result.error, 'error');
      return;
    }
    toast(`Saved ${code.trim().toUpperCase()}.`);
    onDone();
  };

  return (
    <form onSubmit={handleSave} className="mt-3 space-y-2.5 border-t border-[var(--border)] pt-3">
      <input
        aria-label="Course code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. CSM 161"
        className="w-full h-11 sm:h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] placeholder-[var(--text-subtle)] text-sm outline-none focus:border-[var(--focus)]"
      />
      <input
        aria-label="Course title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full h-11 sm:h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-sm outline-none focus:border-[var(--focus)]"
      />
      <input
        aria-label="Lecturer"
        value={lecturer}
        onChange={(e) => setLecturer(e.target.value)}
        placeholder="Lecturer (optional)"
        className="w-full h-11 sm:h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] placeholder-[var(--text-subtle)] text-sm outline-none focus:border-[var(--focus)]"
      />
      <div className="flex gap-2">
        <select
          aria-label="Level"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value) as Level)}
          disabled={levels.length <= 1}
          className="flex-1 h-11 sm:h-9 px-2 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-sm outline-none focus:border-[var(--focus)] disabled:opacity-70"
        >
          {levels.map((l) => (
            <option key={l} value={l}>
              Level {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Semester"
          value={semester}
          onChange={(e) => setSemester(Number(e.target.value) as Semester)}
          className="flex-1 h-11 sm:h-9 px-2 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-sm outline-none focus:border-[var(--focus)]"
        >
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>
      {touched && !isValid && (
        <p className="text-xs text-[var(--text-muted)]">Course code and title are required.</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 min-h-11 sm:min-h-9 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-fg)]"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 min-h-11 sm:min-h-9 rounded-full text-xs font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
