'use client';

import { Download, ExternalLink } from 'lucide-react';
import { Resource } from '@/types/resource';
import { RESOURCE_TYPE_BADGE_CLASSES, RESOURCE_TYPE_LABELS } from '@/lib/resourceType';

export default function ResourceRow({ resource }: { resource: Resource }) {
  const isExternal = Boolean(resource.externalUrl);

  const handleAction = () => {
    window.location.assign(`/api/resources/${encodeURIComponent(resource.id)}/download`);
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-3.5 py-3 shadow-[0_1px_2px_var(--shadow),0_1px_3px_var(--shadow)] transition-shadow duration-200 hover:shadow-[0_1px_2px_var(--shadow),0_12px_28px_-8px_var(--shadow)]">
      <span
        className={`hidden sm:inline-flex justify-center shrink-0 w-[108px] text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${RESOURCE_TYPE_BADGE_CLASSES[resource.type]}`}
      >
        {RESOURCE_TYPE_LABELS[resource.type]}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
          {resource.title}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
          <span className="sm:hidden">{RESOURCE_TYPE_LABELS[resource.type]} · </span>
          {resource.academicYear}
          {!isExternal && resource.fileSize ? ` · ${resource.fileSize}` : ''}
          {isExternal ? ' · External link' : ''}
        </p>
      </div>

      {!isExternal && resource.fileSize && (
        <span className="hidden sm:inline shrink-0 text-xs text-[var(--text-muted)] tabular-nums">
          {resource.fileSize}
        </span>
      )}

      <button
        type="button"
        onClick={handleAction}
        className="shrink-0 flex items-center gap-1.5 px-4 min-h-11 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_1px_2px_var(--shadow)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_var(--shadow)]"
      >
        {isExternal ? (
          <>
            Open <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </>
        ) : (
          <>
            Download <Download className="w-3.5 h-3.5" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}
