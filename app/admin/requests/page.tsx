'use client';

import AdminPageShell from '@/components/AdminPageShell';
import { useLibrary } from '@/components/LibraryProvider';
import { useRequireRole } from '@/components/SessionProvider';
import { useToast } from '@/components/ToastProvider';
import type { RequestStatus } from '@/types/resource';

const STATUS_LABELS: Record<RequestStatus, string> = {
  OPEN: 'Open',
  FULFILLED: 'Fulfilled',
  DISMISSED: 'Dismissed',
};

const STATUS_ACTIONS: RequestStatus[] = ['OPEN', 'FULFILLED', 'DISMISSED'];

export default function AdminRequestsPage() {
  const { permitted } = useRequireRole(['SUPER_ADMIN']);
  const { requests, updateRequestStatus } = useLibrary();
  const toast = useToast();

  if (!permitted) return null;

  const handleStatus = async (id: string, status: RequestStatus) => {
    const result = await updateRequestStatus(id, status);
    if (result.ok) toast(`Request marked ${STATUS_LABELS[status].toLowerCase()}.`);
    else toast(result.error, 'error');
  };

  return (
    <AdminPageShell>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Material requests</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Students&apos; &quot;I can&apos;t find this&quot; requests — your coverage radar.
      </p>

      {requests.length === 0 ? (
        <div className="mt-6 text-center py-10 text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
          No requests yet.
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-[var(--surface)] rounded-2xl p-5 shadow-[0_1px_3px_var(--shadow)] transition-shadow duration-200 hover:shadow-[0_1px_3px_var(--shadow),0_10px_24px_-6px_var(--shadow)]"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  {request.courseCode && (
                    <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-subtle)]">
                      {request.courseCode}
                    </span>
                  )}
                  <p className="mt-1.5 text-sm text-[var(--text-primary)]">{request.note}</p>
                </div>

                <span
                  className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    request.status === 'OPEN'
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                  }`}
                >
                  {STATUS_LABELS[request.status]}
                </span>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap border-t border-[var(--border)] pt-3">
                {STATUS_ACTIONS.filter((status) => status !== request.status).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatus(request.id, status)}
                    className="min-h-11 sm:min-h-9 px-3 rounded-full text-xs font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]"
                  >
                    Mark {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
