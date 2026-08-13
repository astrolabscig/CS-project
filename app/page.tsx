'use client';

import { useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import CourseCard from '@/components/CourseCard';
import StatCard from '@/components/StatCard';
import LandingPage from '@/components/LandingPage';
import { Level, Semester } from '@/types/resource';
import { useSession } from '@/components/SessionProvider';
import { useLibrary } from '@/components/LibraryProvider';

export default function LibraryPage() {
  const { session } = useSession();
  const { courses } = useLibrary();
  const isAdmin = session?.role === 'SUPER_ADMIN';
  // Only super-admins can switch levels (design doc §3: student/rep reads are
  // locked to their own level). `null` means "no manual override yet" — the
  // admin's default level then simply tracks the current session.
  const [manualLevel, setManualLevel] = useState<Level | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admins can browse any level regardless of their own `level` field, so
  // defaulting their switcher to 100 is just a starting point. A student/rep
  // with no level assigned yet gets `null` here instead of a fabricated
  // level — see the empty state below.
  const activeLevel: Level | null = isAdmin ? manualLevel ?? session?.level ?? 100 : session?.level ?? null;

  const coursesByLevel = useMemo(
    () => courses.filter((course) => course.level === activeLevel),
    [courses, activeLevel]
  );

  const totalResources = useMemo(
    () => coursesByLevel.reduce((sum, c) => sum + c.resourceCount, 0),
    [coursesByLevel]
  );

  const semesters: Semester[] = [1, 2];

  // Signed-out visitors to "/" get the public marketing landing page instead
  // of the course browser below (SessionProvider exempts "/" from the
  // sign-in redirect specifically so this branch can render). Placed after
  // every hook call above so hook order stays constant across renders.
  if (!session) {
    return <LandingPage />;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[var(--bg)]">
      <TopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          activeLevel={activeLevel}
          onSelectLevel={isAdmin ? setManualLevel : () => {}}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          <p className="text-sm text-[var(--text-muted)]">Browse courses and their resources.</p>
          <h1 className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {activeLevel ? `Level ${activeLevel}` : 'Welcome'}
          </h1>

          {activeLevel === null ? (
            <div className="mt-6 text-center py-10 text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
              Your account doesn&apos;t have a level assigned yet. A department admin needs to
              set this before you can browse courses — check back soon.
            </div>
          ) : coursesByLevel.length === 0 ? (
            <div className="mt-6 text-center py-10 text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
              No courses in this level yet.
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full sm:max-w-lg">
                <StatCard label="Courses" value={coursesByLevel.length} />
                <StatCard label="Resources" value={totalResources} />
                <StatCard label="Semesters" value={semesters.length} />
              </div>

              {semesters.map((semester) => {
                const coursesInSem = coursesByLevel.filter((c) => c.semester === semester);
                if (coursesInSem.length === 0) return null;

                return (
                  <section key={semester} className="mt-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                      Semester {semester}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {coursesInSem.map((course) => (
                        <CourseCard key={course.code} course={course} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

