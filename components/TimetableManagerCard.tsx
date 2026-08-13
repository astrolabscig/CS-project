'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { api } from '@/lib/clientApi';
import { useToast } from './ToastProvider';
import type { Level } from '@/types/resource';

interface ClassSessionDto {
  id: number;
  courseCode: string;
  courseTitle: string;
  date: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  venue: string | null;
}

const EXTRACT_COOLDOWN_MS = 5 * 60 * 1000;
const EMPTY_ROW = { courseCode: '', courseTitle: '', date: '', startTime: '09:00', endTime: '10:00', venue: '' };

// Rep/admin dashboard tool: pick a level + academic period, upload ONE file
// representing that whole level's timetable (an exam timetable covering
// every course, not a single course's schedule), let Gemini extract every
// row, review/correct/delete/add rows inline, then publish them all at
// once. Students only ever see the published result on their own dashboard
// (DashboardTimetable) — this is the only place that writes to it.
export default function TimetableManagerCard({ levels }: { levels: Level[] }) {
  const toast = useToast();
  const levelSelectId = useId();
  const periodInputId = useId();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedLevel, setSelectedLevel] = useState<Level | null>(levels[0] ?? null);
  const [academicPeriod, setAcademicPeriod] = useState('');
  const [draft, setDraft] = useState<ClassSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [addingRow, setAddingRow] = useState(false);

  const load = useCallback(async () => {
    if (selectedLevel === null) {
      setDraft([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDraft(await api<ClassSessionDto[]>(`/api/timetable?level=${selectedLevel}&status=draft`));
    } catch {
      setError('Could not load the review queue right now.');
    }
    setLoading(false);
  }, [selectedLevel]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || extracting || cooldownRemaining > 0 || selectedLevel === null) return;
    if (!academicPeriod.trim()) {
      toast('Enter the academic period first (e.g. "2025/2026 Semester 2").', 'error');
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('levelScope', String(selectedLevel));
      formData.set('academicPeriod', academicPeriod.trim());
      const result = await api<{ created: number; message?: string }>('/api/timetable/extract', {
        method: 'POST',
        body: formData,
      });
      setCooldownUntil(Date.now() + EXTRACT_COOLDOWN_MS);
      setNow(Date.now());
      if (result.created === 0) {
        toast(result.message ?? "Couldn't confidently read this timetable — add sessions manually below.", 'error');
      } else {
        toast(`Read ${result.created} session${result.created === 1 ? '' : 's'} — review and publish below.`);
      }
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't read this timetable — try a clearer photo or enter manually.", 'error');
      setCooldownUntil(Date.now() + EXTRACT_COOLDOWN_MS);
      setNow(Date.now());
    } finally {
      setExtracting(false);
    }
  };

  const patchRow = async (id: number, patch: Partial<Omit<ClassSessionDto, 'id'>>) => {
    setDraft((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    try {
      await api(`/api/timetable/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save that change.', 'error');
      await load();
    }
  };

  const deleteRow = async (id: number) => {
    const previous = draft;
    setDraft((rows) => rows.filter((r) => r.id !== id));
    try {
      await api(`/api/timetable/${id}`, { method: 'DELETE' });
    } catch (err) {
      setDraft(previous);
      toast(err instanceof Error ? err.message : 'Could not delete that row.', 'error');
    }
  };

  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingRow || selectedLevel === null) return;
    if (!academicPeriod.trim() || !newRow.courseCode.trim() || !newRow.courseTitle.trim() || !newRow.date) {
      toast('Fill in the academic period, course code, title, and date.', 'error');
      return;
    }
    if (newRow.endTime <= newRow.startTime) {
      toast('End time must be after start time.', 'error');
      return;
    }
    setAddingRow(true);
    try {
      const created = await api<ClassSessionDto>('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelScope: selectedLevel,
          academicPeriod: academicPeriod.trim(),
          courseCode: newRow.courseCode.trim(),
          courseTitle: newRow.courseTitle.trim(),
          date: newRow.date,
          startTime: newRow.startTime,
          endTime: newRow.endTime,
          venue: newRow.venue.trim() || undefined,
        }),
      });
      setDraft((rows) => [...rows, created]);
      setNewRow((r) => ({ ...EMPTY_ROW, date: r.date }));
      toast('Session added — review and publish below.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add that session.', 'error');
    } finally {
      setAddingRow(false);
    }
  };

  const handlePublish = async () => {
    if (publishing || draft.length === 0 || selectedLevel === null) return;
    setPublishing(true);
    try {
      const result = await api<{ published: number }>('/api/timetable/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: selectedLevel }),
      });
      toast(`Published ${result.published} session${result.published === 1 ? '' : 's'} — now visible to Level ${selectedLevel} students.`);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not publish the timetable.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (levels.length === 0) return null;

  const uploadLabel = extracting ? 'Reading timetable…' : cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Upload timetable';
  const inputClass =
    'h-11 sm:h-9 px-2.5 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-xs outline-none focus:border-[var(--focus)]';

  return (
    <section className="mt-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Manage Timetables</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          {levels.length > 1 ? (
            <div>
              <label htmlFor={levelSelectId} className="sr-only">
                Level
              </label>
              <select
                id={levelSelectId}
                value={selectedLevel ?? ''}
                onChange={(e) => setSelectedLevel(Number(e.target.value) as Level)}
                className={`w-full sm:w-28 ${inputClass}`}
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="inline-flex items-center h-11 sm:h-9 px-3 rounded-xl bg-[var(--surface-2)] text-xs font-semibold text-[var(--text-primary)]">
              Level {levels[0]}
            </span>
          )}
          <div>
            <label htmlFor={periodInputId} className="sr-only">
              Academic period
            </label>
            <input
              id={periodInputId}
              type="text"
              value={academicPeriod}
              onChange={(e) => setAcademicPeriod(e.target.value)}
              placeholder="e.g. 2025/2026 Semester 2"
              maxLength={60}
              className={`w-full sm:w-56 ${inputClass}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor={fileInputId} className="sr-only">
              Upload timetable image or PDF
            </label>
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="sr-only"
              disabled={extracting || cooldownRemaining > 0}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting || cooldownRemaining > 0}
              aria-live="polite"
              className="inline-flex items-center gap-1.5 min-h-11 sm:min-h-9 px-3.5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              {uploadLabel}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-[var(--text-muted)] mb-3" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="h-24 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
      ) : draft.length === 0 ? (
        <div className="text-center py-8 text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
          No pending rows for Level {selectedLevel}. Upload a timetable, or add a session manually below.
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold text-[var(--text-primary)]">Review before publishing ({draft.length})</p>
          <p className="mt-0.5 mb-3 text-[11px] text-[var(--text-subtle)]">
            AI-read from the uploaded file — check and correct every row before it goes live to students.
          </p>

          <div className="space-y-2">
            {draft.map((row) => (
              <div key={row.id} className="rounded-xl bg-[var(--surface-2)] p-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <input
                    aria-label="Course code"
                    type="text"
                    placeholder="Code"
                    value={row.courseCode}
                    onChange={(e) => setDraft((rows) => rows.map((r) => (r.id === row.id ? { ...r, courseCode: e.target.value } : r)))}
                    onBlur={(e) => patchRow(row.id, { courseCode: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    aria-label="Course title"
                    type="text"
                    placeholder="Title"
                    value={row.courseTitle}
                    onChange={(e) => setDraft((rows) => rows.map((r) => (r.id === row.id ? { ...r, courseTitle: e.target.value } : r)))}
                    onBlur={(e) => patchRow(row.id, { courseTitle: e.target.value })}
                    className={`${inputClass} col-span-2 sm:col-span-1`}
                  />
                  <input
                    aria-label="Date"
                    type="date"
                    value={row.date.slice(0, 10)}
                    onChange={(e) => patchRow(row.id, { date: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    aria-label="Start time"
                    type="time"
                    value={row.startTime}
                    onChange={(e) => patchRow(row.id, { startTime: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    aria-label="End time"
                    type="time"
                    value={row.endTime}
                    onChange={(e) => patchRow(row.id, { endTime: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      aria-label="Venue"
                      type="text"
                      placeholder="Venue"
                      value={row.venue ?? ''}
                      onChange={(e) => setDraft((rows) => rows.map((r) => (r.id === row.id ? { ...r, venue: e.target.value } : r)))}
                      onBlur={(e) => patchRow(row.id, { venue: e.target.value || null })}
                      className={`${inputClass} flex-1 min-w-0`}
                    />
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      aria-label="Delete this session"
                      className="shrink-0 w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-3)] active:bg-[var(--surface-3)]"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="mt-3 w-full min-h-11 sm:min-h-9 px-4 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-semibold disabled:opacity-50"
          >
            {publishing ? 'Publishing…' : `Publish ${draft.length} session${draft.length === 1 ? '' : 's'} to Level ${selectedLevel} students`}
          </button>
        </div>
      )}

      <form onSubmit={handleAddRow} className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Add a session manually</p>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <input
            aria-label="Course code"
            type="text"
            placeholder="Code"
            value={newRow.courseCode}
            onChange={(e) => setNewRow((r) => ({ ...r, courseCode: e.target.value }))}
            className={inputClass}
          />
          <input
            aria-label="Course title"
            type="text"
            placeholder="Title"
            value={newRow.courseTitle}
            onChange={(e) => setNewRow((r) => ({ ...r, courseTitle: e.target.value }))}
            className={`${inputClass} col-span-2 sm:col-span-1`}
          />
          <input
            aria-label="Date"
            type="date"
            value={newRow.date}
            onChange={(e) => setNewRow((r) => ({ ...r, date: e.target.value }))}
            className={inputClass}
          />
          <input
            aria-label="Start time"
            type="time"
            value={newRow.startTime}
            onChange={(e) => setNewRow((r) => ({ ...r, startTime: e.target.value }))}
            className={inputClass}
          />
          <input
            aria-label="End time"
            type="time"
            value={newRow.endTime}
            onChange={(e) => setNewRow((r) => ({ ...r, endTime: e.target.value }))}
            className={inputClass}
          />
          <div className="flex items-center gap-1.5">
            <input
              aria-label="Venue"
              type="text"
              placeholder="Venue"
              value={newRow.venue}
              onChange={(e) => setNewRow((r) => ({ ...r, venue: e.target.value }))}
              className={`${inputClass} flex-1 min-w-0`}
            />
            <button
              type="submit"
              disabled={addingRow}
              aria-label="Add session"
              className="shrink-0 w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
