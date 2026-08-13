'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Upload } from 'lucide-react';
import PageShell from '@/components/PageShell';
import StatCard from '@/components/StatCard';
import CourseCard from '@/components/CourseCard';
import UploadResourceDrawer from '@/components/UploadResourceDrawer';
import TimetableManagerCard from '@/components/TimetableManagerCard';
import Drawer from '@/components/Drawer';
import { useLibrary } from '@/components/LibraryProvider';
import { useRequireRole } from '@/components/SessionProvider';
import { useToast } from '@/components/ToastProvider';
import type { Course, Level, Semester } from '@/types/resource';

const SEMESTERS: Semester[] = [1, 2];

function AddCourseForm({ levels, onDone }: { levels: Level[]; onDone: () => void }) {
  const { addCourse } = useLibrary();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [level, setLevel] = useState<Level>(levels[0]);
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
        <label htmlFor="rep-new-course-code" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Course code
        </label>
        <input
          id="rep-new-course-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. CSM 161"
          className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] placeholder-[var(--text-subtle)] text-sm outline-none focus:border-[var(--focus)]"
        />
      </div>
      <div>
        <label htmlFor="rep-new-course-title" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Title
        </label>
        <input
          id="rep-new-course-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Introduction to Robotics"
          className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] placeholder-[var(--text-subtle)] text-sm outline-none focus:border-[var(--focus)]"
        />
      </div>
      <div>
        <label htmlFor="rep-new-course-lecturer" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Lecturer (optional)
        </label>
        <input
          id="rep-new-course-lecturer"
          value={lecturer}
          onChange={(e) => setLecturer(e.target.value)}
          className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-sm outline-none focus:border-[var(--focus)]"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="rep-new-course-level" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            Level
          </label>
          <select
            id="rep-new-course-level"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value) as Level)}
            disabled={levels.length <= 1}
            className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-sm outline-none focus:border-[var(--focus)] disabled:opacity-70"
          >
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="rep-new-course-semester" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            Semester
          </label>
          <select
            id="rep-new-course-semester"
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

export default function RepDashboardPage() {
  const { session, permitted } = useRequireRole(['REP']);
  const { courses, resources } = useLibrary();
  const [uploadCourse, setUploadCourse] = useState<Course | null>(null);
  const [addCourseOpen, setAddCourseOpen] = useState(false);

  const myLevels = useMemo(
    () => (session?.scopes && session.scopes.length > 0 ? session.scopes : session?.level ? [session.level] : []),
    [session]
  );
  const myLevelCourses = useMemo(() => courses.filter((c) => myLevels.includes(c.level)), [courses, myLevels]);
  const myUploadCount = useMemo(
    () => resources.filter((r) => r.status === 'ACTIVE' && r.uploadedBy === session?.id).length,
    [resources, session?.id]
  );

  if (!permitted || !session) return null;

  return (
    <PageShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {session.level ? `Level ${session.level} — Rep dashboard` : 'Rep dashboard'}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Upload material for your assigned courses.</p>
        </div>
        {myLevels.length > 0 && (
          <button
            type="button"
            onClick={() => setAddCourseOpen(true)}
            className="shrink-0 flex items-center gap-1.5 min-h-11 px-3.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-fg)]"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add course
          </button>
        )}
      </div>

      {session.level === null ? (
        <div className="mt-6 text-center py-10 text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
          You don&apos;t have a level scope assigned yet. A department admin needs to set this
          before you can upload — check back soon.
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full sm:max-w-lg">
            <StatCard label="Your uploads" value={myUploadCount} />
            <StatCard label="Courses in your level" value={myLevelCourses.length} />
          </div>

          <div className="mt-4">
            <Link href="/my-uploads" className="text-sm font-medium text-[var(--text-primary)] underline">
              View / manage all your uploads
            </Link>
          </div>

          <TimetableManagerCard levels={myLevels} />

          {myLevelCourses.length === 0 ? (
            <div className="mt-6 text-center py-10 text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
              No courses in your level yet.
            </div>
          ) : (
            SEMESTERS.map((semester) => {
              const inSem = myLevelCourses.filter((c) => c.semester === semester);
              if (inSem.length === 0) return null;
              return (
                <section key={semester} className="mt-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                    Semester {semester}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inSem.map((course) => (
                      <div key={course.code}>
                        <CourseCard course={course} />
                        <button
                          type="button"
                          onClick={() => setUploadCourse(course)}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 min-h-9 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-fg)]"
                        >
                          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                          Upload material
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </>
      )}

      {uploadCourse && (
        <UploadResourceDrawer
          course={uploadCourse}
          open={Boolean(uploadCourse)}
          onClose={() => setUploadCourse(null)}
        />
      )}

      {myLevels.length > 0 && (
        <Drawer open={addCourseOpen} onClose={() => setAddCourseOpen(false)} title="Add course">
          <AddCourseForm levels={myLevels} onDone={() => setAddCourseOpen(false)} />
        </Drawer>
      )}
    </PageShell>
  );
}
