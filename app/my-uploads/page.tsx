'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { useLibrary } from '@/components/LibraryProvider';
import { useRequireRole } from '@/components/SessionProvider';
import { useToast } from '@/components/ToastProvider';
import { RESOURCE_TYPE_BADGE_CLASSES, RESOURCE_TYPE_LABELS } from '@/lib/resourceType';
import FilterPills from '@/components/FilterPills';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';

// TODO(backend): GET /api/courses/:code/resources filtered by uploadedById,
// DELETE /api/resources/:id for soft-delete (rep/admin, scope-checked — see
// Appendix B). This reads/writes the in-memory LibraryProvider instead.
export default function MyUploadsPage() {
  const { session, permitted } = useRequireRole(['REP', 'SUPER_ADMIN']);
  const { resources, removeResource } = useLibrary();
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  if (!permitted) return null;

  const handleRemove = async (id: string, title: string) => {
    const result = await removeResource(id);
    if (result.ok) toast(`Removed "${title}".`);
    else toast(result.error, 'error');
  };

  const myUploads = resources.filter(
    (r) => r.status === 'ACTIVE' && session && r.uploadedBy === session.id
  );
  const typeOptions = Array.from(new Set(myUploads.map((resource) => RESOURCE_TYPE_LABELS[resource.type])));
  const filteredUploads = myUploads.filter(
    (resource) => !typeFilter || RESOURCE_TYPE_LABELS[resource.type] === typeFilter
  );

  const byCourse = new Map<string, typeof myUploads>();
  for (const resource of filteredUploads) {
    const list = byCourse.get(resource.courseCode) ?? [];
    list.push(resource);
    byCourse.set(resource.courseCode, list);
  }

  return (
    <PageShell>
      <PageHeader eyebrow="Contributor workspace" title="My uploads" description="Resources you&apos;ve uploaded this session, grouped by course." actions={<Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-2)]">Browse courses</Link>} />
      {myUploads.length > 0 && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 text-xs"><span className="rounded-full bg-[var(--accent-subtle)] px-3 py-1.5 font-semibold text-[var(--text-primary)]">{myUploads.length} active</span><span className="rounded-full bg-[var(--surface-2)] px-3 py-1.5 font-semibold text-[var(--text-muted)]">{new Set(myUploads.map((resource) => resource.courseCode)).size} courses</span></div>
          <FilterPills label="Type" options={typeOptions} active={typeFilter} onChange={setTypeFilter} />
        </div>
      )}

      {myUploads.length === 0 ? (
        <div className="mt-6"><EmptyState icon={Trash2} title="No uploads yet" description="Open a course in your level and use “Upload material” to share your first resource." action={<Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)]">Browse courses</Link>} /></div>
      ) : filteredUploads.length === 0 ? (
        <div className="mt-6"><EmptyState icon={Trash2} title="No uploads match this type" description="Try another material type to see more of your uploads." action={<button type="button" onClick={() => setTypeFilter(null)} className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)]">Clear filter</button>} /></div>
      ) : (
        <div className="mt-6 space-y-6">
          {Array.from(byCourse.entries()).map(([courseCode, uploads]) => (
            <section key={courseCode}>
              <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-3">
                <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-subtle)]">
                  {courseCode}
                </span>
                {uploads[0].courseTitle}
              </h2>
              <div className="space-y-2">
                {uploads.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-2 sm:gap-3 bg-[var(--surface)] rounded-2xl px-3.5 py-3 shadow-[0_1px_3px_var(--shadow)] transition-shadow duration-200 hover:shadow-[0_1px_3px_var(--shadow),0_10px_24px_-6px_var(--shadow)]"
                  >
                    <span className={`hidden sm:inline-flex justify-center shrink-0 w-[108px] text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${RESOURCE_TYPE_BADGE_CLASSES[resource.type]}`}>
                      {RESOURCE_TYPE_LABELS[resource.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {resource.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                        {resource.academicYear}
                        {resource.fileSize ? ` · ${resource.fileSize}` : ''}
                        {resource.externalUrl ? ' · Link' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(resource.id, resource.title)}
                      aria-label={`Remove ${resource.title}`}
                      className="shrink-0 flex items-center gap-1.5 min-h-11 px-3 rounded-full text-xs font-semibold text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface-3)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
