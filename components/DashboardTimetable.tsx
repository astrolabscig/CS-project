'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ExternalLink } from 'lucide-react';
import { api } from '@/lib/clientApi';
import type { Level } from '@/types/resource';

interface ClassSessionDto {
  id: number;
  academicPeriod: string;
  courseCode: string;
  courseTitle: string;
  date: string; // ISO date
  startTime: string;
  endTime: string;
  venue: string | null;
  sourceUploadId: number | null;
}

function formatTime12h(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function sortByDateThenTime(a: ClassSessionDto, b: ClassSessionDto) {
  const dateDiff = dateKey(a.date).localeCompare(dateKey(b.date));
  return dateDiff !== 0 ? dateDiff : a.startTime.localeCompare(b.startTime);
}

// Read-only level-wide timetable, every course on one calendar — the
// student-facing view (design doc: a level's timetable is ONE table
// covering all its courses, keyed by date, e.g. an exam timetable — it
// lives on the main dashboard, not buried in each course page).
// Uploading/reviewing it is a rep/admin dashboard tool instead, see
// TimetableManagerCard.
export default function DashboardTimetable({ level }: { level: Level | null }) {
  const [sessions, setSessions] = useState<ClassSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (level === null) {
      setSessions([]);
      setLoading(false);
      return;
    }
    let ignore = false;
    setLoading(true);
    setError(null);
    api<ClassSessionDto[]>(`/api/timetable?level=${level}`)
      .then((data) => {
        if (!ignore) setSessions(data);
      })
      .catch(() => {
        if (!ignore) setError('Could not load the timetable right now.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [level]);

  const grouped = useMemo(() => {
    const byDate = new Map<string, ClassSessionDto[]>();
    for (const session of [...sessions].sort(sortByDateThenTime)) {
      const key = dateKey(session.date);
      const list = byDate.get(key) ?? [];
      list.push(session);
      byDate.set(key, list);
    }
    return Array.from(byDate.entries()).map(([key, daySessions]) => ({ key, label: formatDateLabel(daySessions[0].date), sessions: daySessions }));
  }, [sessions]);

  const sourceUploadIds = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.sourceUploadId).filter((id): id is number => id !== null))),
    [sessions]
  );

  if (level === null) return null;

  return (
    <section className="mt-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Your Timetable</h2>

      {error && (
        <p className="text-xs text-[var(--text-muted)] mb-3" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-8 text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
          No timetable published for this level yet.
        </div>
      ) : (
        <div className="space-y-6">
          {sourceUploadIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sourceUploadIds.map((id) => (
                <a
                  key={id}
                  href={`/api/timetable/uploads/${id}/download`}
                  className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full bg-[var(--surface-2)] text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-3)]"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  View original file
                </a>
              ))}
            </div>
          )}

          {grouped.map(({ key, label, sessions: daySessions }) => (
            <div key={key}>
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 pb-1 border-b border-[var(--border)]">
                <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                {label}
              </h3>
              <div className="space-y-2.5">
                {daySessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3 shadow-[0_1px_2px_var(--shadow),0_6px_18px_-8px_var(--shadow)]"
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                        {formatTime12h(session.startTime)}
                      </span>
                      <span className="text-xs font-medium text-[var(--text-subtle)]">
                        – {formatTime12h(session.endTime)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="shrink-0 inline-flex items-center font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)]">
                        {session.courseCode}
                      </span>
                      <span className="min-w-0 text-sm font-bold text-[var(--text-primary)]">{session.courseTitle}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">{session.venue || 'Venue TBA'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
