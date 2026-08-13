'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, Sparkles, X } from 'lucide-react';
import { api } from '@/lib/clientApi';
import { useToast } from './ToastProvider';
import type { Course } from '@/types/resource';

interface VideoDto {
  id: number;
  title: string;
  youtubeUrl: string;
  channelName: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
}

// Client-side cooldown mirrors the server's (app/api/courses/[code]/videos/suggest)
// so the button visibly disables instead of just erroring on repeat clicks.
const SUGGEST_COOLDOWN_MS = 5 * 60 * 1000;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function RecommendedVideos({ course, canUpload }: { course: Course; canUpload: boolean }) {
  const toast = useToast();
  const [approved, setApproved] = useState<VideoDto[]>([]);
  const [queue, setQueue] = useState<VideoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [topic, setTopic] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setApproved(await api<VideoDto[]>(`/api/courses/${encodeURIComponent(course.code)}/videos`));
    } catch {
      setError('Could not load recommended videos right now.');
    }
    if (canUpload) {
      try {
        setQueue(await api<VideoDto[]>(`/api/courses/${encodeURIComponent(course.code)}/videos?status=suggested`));
      } catch {
        // The public approved section already loaded (or reported its own
        // error) — a queue-fetch failure shouldn't block the whole section.
      }
    }
    setLoading(false);
  }, [course.code, canUpload]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;

  const handleSuggest = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (suggesting || cooldownRemaining > 0) return;
    setSuggesting(true);
    try {
      const trimmedTopic = topic.trim();
      const result = await api<{ created: number }>(`/api/courses/${encodeURIComponent(course.code)}/videos/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmedTopic || undefined }),
      });
      setCooldownUntil(Date.now() + SUGGEST_COOLDOWN_MS);
      setNow(Date.now());
      toast(
        result.created === 0
          ? trimmedTopic
            ? `No new video suggestions found for "${trimmedTopic}".`
            : 'No new video suggestions found for this course.'
          : `Found ${result.created} video suggestion${result.created === 1 ? '' : 's'} — review below before they go live.`
      );
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't fetch suggestions right now — try again later.", 'error');
      setCooldownUntil(Date.now() + SUGGEST_COOLDOWN_MS);
      setNow(Date.now());
    } finally {
      setSuggesting(false);
    }
  };

  const handleReview = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api(`/api/videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      toast(status === 'APPROVED' ? 'Video approved — now visible to students.' : 'Video rejected.');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update this video.', 'error');
    }
  };

  const suggestLabel = suggesting ? 'Finding videos…' : cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Suggest videos';

  return (
    <section className="mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Recommended Videos</h2>
        {canUpload && (
          <form onSubmit={handleSuggest} className="flex items-center gap-2">
            <label htmlFor="video-topic-input" className="sr-only">
              Topic to search for (optional)
            </label>
            <input
              id="video-topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (optional), e.g. Binary search trees"
              maxLength={120}
              disabled={suggesting}
              className="h-9 min-w-0 flex-1 sm:w-56 px-3 rounded-full bg-[var(--surface-2)] border border-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-subtle)] outline-none focus:border-[var(--focus)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={suggesting || cooldownRemaining > 0}
              aria-live="polite"
              className="shrink-0 inline-flex items-center gap-1.5 min-h-9 px-3.5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-semibold disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              {suggestLabel}
            </button>
          </form>
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--text-muted)] mb-3" role="alert">
          {error}
        </p>
      )}

      {canUpload && queue.length > 0 && (
        <div className="mb-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold text-[var(--text-primary)]">Review queue ({queue.length})</p>
          <p className="mt-0.5 mb-3 text-[11px] text-[var(--text-subtle)]">
            Ranked by views, likes, and channel size — not an editorial rating. Preview on YouTube before approving.
          </p>
          <ul className="space-y-2">
            {queue.map((v) => (
              <li key={v.id} className="flex items-center gap-3 bg-[var(--surface-2)] rounded-xl p-2.5">
                <span className="hidden sm:block shrink-0 w-20 aspect-video rounded-lg overflow-hidden bg-[var(--surface-3)]">
                  {v.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail, not a local/optimizable asset
                    <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={v.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)] hover:underline"
                  >
                    <span className="truncate">{v.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                  </a>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {v.channelName} · {formatCount(v.viewCount)} views · {formatCount(v.likeCount)} likes
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReview(v.id, 'REJECTED')}
                    aria-label={`Reject ${v.title}`}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(v.id, 'APPROVED')}
                    aria-label={`Approve ${v.title}`}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)]"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
              <div className="aspect-video bg-[var(--surface-2)] animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 w-4/5 rounded bg-[var(--surface-2)] animate-pulse" />
                <div className="h-3 w-2/5 rounded bg-[var(--surface-2)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : approved.length === 0 ? (
        <div className="text-center py-8 text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
          No recommended videos yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {approved.map((v) => (
            <a
              key={v.id}
              href={v.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-[0_1px_2px_var(--shadow)] transition-shadow duration-200 hover:shadow-[0_12px_28px_-8px_var(--shadow)]"
            >
              <div className="aspect-video bg-[var(--surface-2)]">
                {v.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail, not a local/optimizable asset
                  <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2">{v.title}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)] truncate">{v.channelName}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-subtle)]">
                  {formatCount(v.viewCount)} views
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
