'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AdminPageShell from '@/components/AdminPageShell';
import Drawer from '@/components/Drawer';
import { useLibrary } from '@/components/LibraryProvider';
import { useRequireRole } from '@/components/SessionProvider';
import { useToast } from '@/components/ToastProvider';
import type { Course, Level, Semester } from '@/types/resource';

const LEVELS: Level[] = [100, 200, 300, 400];
const SEMESTERS: Semester[] = [1, 2];

function EditCourseForm({ course, onDone }: { course: Course; onDone: () => void }) {
  const { updateCourse } = useLibrary();
  const toast = useToast();
  const [title, setTitle] = useState(course.title);
  const [lecturer, setLecturer] = useState(course.lecturer ?? '');
  const [level, setLevel] = useState<Level>(course.level);
  const [semester, setSemester] = useState<Semester>(course.semester);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateCourse(course.code, {
      title: title.trim() || course.title,
      lecturer: lecturer.trim() || undefined,
      level,
      semester,
    });
    if (!result.ok) {
      toast(result.error, 'error');
      return;
    }
    toast(`Saved ${course.code}.`);
    onDone();
  };

  return (
    <form onSubmit={handleSave} className="mt-3 space-y-2.5 border-t border-[var(--border)] pt-3">
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
          className="flex-1 h-11 sm:h-9 px-2 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-sm outline-none focus:border-[var(--focus)]"
        >
          {LEVELS.map((l) => (
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

function AddCourseForm({ onDone }: { onDone: () => void }) {
  const { addCourse } = useLibrary();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [level, setLevel] = useState<Level>(100);
  const [semester, setSemester] = useState<Semester>(1);
  const [touched, setTouched] = useState(false);

  const isValid = code.trim().length > 0 && title.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    const result = await addCourse({
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
    toast(`Added ${code.trim()}.`);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="new-course-code" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Course code
        </label>
        <input
          id="new-course-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. CSM 161"
          className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] placeholder-[var(--text-subtle)] text-sm outline-none focus:border-[var(--focus)]"
        />
      </div>
      <div>
        <label htmlFor="new-course-title" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Title
        </label>
        <input
          id="new-course-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Introduction to Robotics"
          className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] placeholder-[var(--text-subtle)] text-sm outline-none focus:border-[var(--focus)]"
        />
      </div>
      <div>
        <label htmlFor="new-course-lecturer" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Lecturer (optional)
        </label>
        <input
          id="new-course-lecturer"
          value={lecturer}
          onChange={(e) => setLecturer(e.target.value)}
          className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-sm outline-none focus:border-[var(--focus)]"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="new-course-level" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            Level
          </label>
          <select
            id="new-course-level"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value) as Level)}
            className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-sm outline-none focus:border-[var(--focus)]"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="new-course-semester" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            Semester
          </label>
          <select
            id="new-course-semester"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value) as Semester)}
            className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-sm outline-none focus:border-[var(--focus)]"
          >
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      {touched && !isValid && (
        <p className="text-xs text-[var(--text-muted)]">Course code and title are required.</p>
      )}
      <button
        type="submit"
        className="w-full min-h-11 px-4 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-semibold"
      >
        Add course
      </button>
    </form>
  );
}

export default function AdminCoursesPage() {
  const { permitted } = useRequireRole(['SUPER_ADMIN']);
  const { courses, removeCourse } = useLibrary();
  const toast = useToast();
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  if (!permitted) return null;

  const handleDelete = async (course: Course) => {
    const confirmed = window.confirm(
      `Delete ${course.code} — ${course.title}?\n\nThis permanently deletes the course and all ${course.resourceCount} of its resources (files included). This cannot be undone.`
    );
    if (!confirmed) return;
    setDeletingCode(course.code);
    const result = await removeCourse(course.code);
    setDeletingCode(null);
    if (!result.ok) {
      toast(result.error, 'error');
      return;
    }
    toast(`Deleted ${course.code}.`);
  };

  return (
    <AdminPageShell>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Manage courses</h1>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="shrink-0 flex items-center gap-1.5 min-h-11 px-3.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-fg)]"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Add course
        </button>
      </div>

      {LEVELS.map((level) => {
        const levelCourses = courses
          .filter((c) => c.level === level)
          .sort((a, b) => a.code.localeCompare(b.code));
        if (levelCourses.length === 0) return null;

        return (
          <section key={level} className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Level {level}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {levelCourses.map((course) => (
                <div
                  key={course.code}
                  className="bg-[var(--surface)] rounded-2xl p-5 shadow-[0_1px_3px_var(--shadow)] transition-shadow duration-200 hover:shadow-[0_1px_3px_var(--shadow),0_10px_24px_-6px_var(--shadow)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-subtle)]">
                        {course.code}
                      </span>
                      <p className="mt-1.5 text-sm font-bold text-[var(--text-primary)] truncate">
                        {course.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)] truncate">
                        {course.lecturer ? `${course.lecturer} · ` : ''}Semester {course.semester} ·{' '}
                        {course.resourceCount} resources
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingCode(editingCode === course.code ? null : course.code)}
                        aria-label={`Edit ${course.code}`}
                        aria-expanded={editingCode === course.code}
                        className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-3)] active:bg-[var(--surface-3)]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(course)}
                        disabled={deletingCode === course.code}
                        aria-label={`Delete ${course.code}`}
                        className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-3)] active:bg-[var(--surface-3)] disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {editingCode === course.code && (
                    <EditCourseForm course={course} onDone={() => setEditingCode(null)} />
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title="Add course">
        <AddCourseForm onDone={() => setAddOpen(false)} />
      </Drawer>
    </AdminPageShell>
  );
}
