'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Level } from '@/types/resource';
import { readableLevels } from '@/lib/access';
import { useLibrary } from './LibraryProvider';
import { useSession } from './SessionProvider';

const SEMESTERS: (1 | 2)[] = [1, 2];

interface SidebarProps {
  activeLevel: Level | null;
  onSelectLevel: (level: Level) => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeLevel, onSelectLevel, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { session } = useSession();
  const { courses: allCourses } = useLibrary();
  // Read scope (design doc §3): student/rep see only their own level here;
  // super-admin sees all four.
  const LEVELS = readableLevels(session);
  const [expanded, setExpanded] = useState<Set<Level>>(new Set(activeLevel ? [activeLevel] : []));
  const [collapsed, setCollapsed] = useState(false);

  const toggleExpanded = (level: Level) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  return (
    <>
      {open && (
        <div
          className="fixed top-16 inset-x-0 bottom-0 z-20 bg-[var(--scrim)] md:hidden drawer-scrim-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Floating panel, inset from the canvas edge. Fixed on mobile (off-canvas
          drawer overlay); on desktop it's a normal flex child stretched to the
          full height of the content row by the parent's items-stretch, so it
          never scrolls away with <main> (only <main> scrolls — see page layouts). */}
      <aside
        className={`fixed md:static top-16 bottom-0 md:top-auto md:bottom-auto left-0 z-30 shrink-0 md:my-4 md:ml-4 md:rounded-2xl bg-[var(--surface)] md:border md:border-[var(--border)] shadow-[0_1px_2px_var(--shadow),0_8px_24px_-6px_var(--shadow)] transform transition-transform duration-200 ease-out md:translate-x-0 flex flex-col md:h-auto ${
          collapsed ? 'md:w-16' : 'w-64 md:w-[220px]'
        } ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          {!collapsed && (
            <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
              Levels
            </p>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-3)] ml-auto"
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav aria-label="Level" className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-1">
          {LEVELS.map((level) => {
            const isActiveLevel = level === activeLevel;
            const isExpanded = expanded.has(level) && !collapsed;
            const courses = allCourses.filter((c) => c.level === level);

            return (
              <div key={level}>
                <div
                  className={`flex items-center rounded-full text-sm font-medium ${
                    isActiveLevel
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
                  }`}
                >
                  <button
                    type="button"
                    aria-current={isActiveLevel ? 'page' : undefined}
                    onClick={() => {
                      onSelectLevel(level);
                      onClose();
                    }}
                    className="flex-1 min-w-0 text-left pl-4 pr-2 min-h-11 md:min-h-10 flex items-center justify-between gap-1.5"
                    title={collapsed ? `Level ${level}` : undefined}
                  >
                    <span className="shrink-0">{collapsed ? level : `Level ${level}`}</span>
                    {!collapsed && session?.level === level && (
                      <span
                        className={`min-w-0 truncate text-[9px] font-bold uppercase tracking-wider ${
                          isActiveLevel ? 'text-[var(--accent-fg)] opacity-70' : 'text-[var(--text-subtle)]'
                        }`}
                      >
                        Your level
                      </span>
                    )}
                  </button>

                  {!collapsed && (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} Level ${level}`}
                      onClick={() => toggleExpanded(level)}
                      className="w-11 h-11 md:w-10 md:h-10 shrink-0 flex items-center justify-center"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="ml-3 pl-3 border-l border-[var(--border)] mt-1 mb-2 space-y-1">
                    {SEMESTERS.map((semester) => {
                      const semCourses = courses.filter((c) => c.semester === semester);
                      if (semCourses.length === 0) return null;
                      return (
                        <div key={semester} className="pt-1">
                          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                            Semester {semester}
                          </p>
                          <ul>
                            {semCourses.map((course) => {
                              const href = `/courses/${encodeURIComponent(course.code)}`;
                              const isActiveCourse = pathname === href;
                              return (
                                <li key={course.code}>
                                  <Link
                                    href={href}
                                    onClick={onClose}
                                    className={`flex items-center gap-2 min-h-11 md:min-h-8 px-3 rounded-full text-xs font-mono truncate ${
                                      isActiveCourse
                                        ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)] font-semibold'
                                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
                                    }`}
                                  >
                                    {course.code}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
