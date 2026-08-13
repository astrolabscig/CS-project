'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileSearch, Files, Upload } from 'lucide-react';
import PageShell from '@/components/PageShell';
import FilterPills from '@/components/FilterPills';
import ResourceRow from '@/components/ResourceRow';
import UploadResourceDrawer from '@/components/UploadResourceDrawer';
import RequestMaterialDrawer from '@/components/RequestMaterialDrawer';
import RecommendedVideos from '@/components/RecommendedVideos';
import { useLibrary } from '@/components/LibraryProvider';
import { useSession } from '@/components/SessionProvider';
import { RESOURCE_TYPE_LABELS } from '@/lib/resourceType';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { ResourceListSkeleton } from '@/components/LoadingSkeletons';

export default function CourseDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const courseCode = decodeURIComponent(code);

  const { session } = useSession();
  const { courses, resources: allResources, loading: isLoading } = useLibrary();

  const course = courses.find((c) => c.code.toLowerCase() === courseCode.toLowerCase());
  const resources = useMemo(
    () => allResources.filter((r) => r.courseCode.toLowerCase() === courseCode.toLowerCase() && r.status === 'ACTIVE'),
    [allResources, courseCode]
  );

  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const canUpload =
    Boolean(course) &&
    (session?.role === 'SUPER_ADMIN' ||
      (session?.role === 'REP' && session.level === course?.level));

  const typeOptions = useMemo(
    () => Array.from(new Set(resources.map((r) => RESOURCE_TYPE_LABELS[r.type]))),
    [resources]
  );
  const yearOptions = useMemo(
    () =>
      Array.from(new Set(resources.flatMap((r) => (r.academicYear ? [r.academicYear] : []))))
        .sort()
        .reverse(),
    [resources]
  );

  const filteredResources = useMemo(
    () =>
      resources.filter(
        (r) =>
          (!typeFilter || RESOURCE_TYPE_LABELS[r.type] === typeFilter) &&
          (!yearFilter || r.academicYear === yearFilter)
      ),
    [resources, typeFilter, yearFilter]
  );

  if (!course) {
    return (
      <PageShell>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to library
        </Link>
        <EmptyState icon={FileSearch} title="Course not found" description="This course is unavailable or outside your current level scope." action={<Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)]">Back to library</Link>} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6"><PageHeader eyebrow={`${course.code} · Level ${course.level}`} title={course.title} description={course.lecturer ?? 'Lecturer to be confirmed'} actions={<><Link href="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-2)]"><ArrowLeft className="w-4 h-4" /> Library</Link>{canUpload && (
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-semibold shadow-sm"
          >
            <Upload className="w-4 h-4" /> Upload material
          </button>
        )}</>} /></div>

      <header className="rounded-3xl bg-[var(--surface)] p-5 shadow-[0_1px_3px_var(--shadow)] sm:p-6">
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 text-center">
          <div><p className="text-xs text-[var(--text-subtle)]">Level</p><p className="mt-1 text-sm font-bold text-[var(--text-primary)]">{course.level}</p></div>
          <div><p className="text-xs text-[var(--text-subtle)]">Semester</p><p className="mt-1 text-sm font-bold text-[var(--text-primary)]">{course.semester}</p></div>
          <div><p className="text-xs text-[var(--text-subtle)]">Materials</p><p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-[var(--text-primary)]"><Files className="h-3.5 w-3.5" aria-hidden="true" />{resources.length}</p></div>
        </div>
      </header>

      <div className="sticky top-16 z-20 -mx-4 mt-4 bg-[var(--bg)] px-4 py-3 sm:static sm:mx-0 sm:mt-6 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="space-y-2.5 overflow-x-auto pb-1">
        <FilterPills label="Type" options={typeOptions} active={typeFilter} onChange={setTypeFilter} />
        <FilterPills label="Year" options={yearOptions} active={yearFilter} onChange={setYearFilter} />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {isLoading ? <ResourceListSkeleton /> : filteredResources.length ? (
          filteredResources.map((resource) => (
            <ResourceRow key={resource.id} resource={resource} />
          ))
        ) : (
          <EmptyState
            icon={FileSearch}
            title="No materials match these filters"
            description="Try another material type or academic year to find what you need."
          />
        )}
      </div>

      <RecommendedVideos course={course} canUpload={canUpload} />

      <div className="mt-6 pt-5 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => setRequestOpen(true)}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
        >
          Can&apos;t find what you&apos;re looking for? Request material
        </button>
      </div>

      {canUpload && (
        <UploadResourceDrawer
          course={course}
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
        />
      )}

      <RequestMaterialDrawer
        courseCode={course.code}
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
      />
    </PageShell>
  );
}
