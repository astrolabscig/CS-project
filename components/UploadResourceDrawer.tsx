'use client';

import { useId, useRef, useState } from 'react';
import { FileText, Link2, Upload, X } from 'lucide-react';
import Drawer from './Drawer';
import { useLibrary } from './LibraryProvider';
import { useToast } from './ToastProvider';
import { RESOURCE_TYPE_LABELS } from '@/lib/resourceType';
import { formatBytes, MAX_FILE_BYTES, validateFile } from '@/lib/upload';
import type { Course, ResourceType } from '@/types/resource';

const RESOURCE_TYPES = Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[];

// Turns "lecture_notes-week3.pdf" into "Lecture notes week3" — a reasonable
// default title so uploaders aren't forced to retype what they just named
// the file. They can still edit it to save under a different title.
function titleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^./\\]+$/, '');
  const spaced = withoutExtension.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!spaced) return '';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export default function UploadResourceDrawer({
  course,
  open,
  onClose,
}: {
  course: Course;
  open: boolean;
  onClose: () => void;
}) {
  const { addResource } = useLibrary();
  const toast = useToast();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [title, setTitle] = useState('');
  const [titleEditedByUser, setTitleEditedByUser] = useState(false);
  const [type, setType] = useState<ResourceType>('SLIDES');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [touched, setTouched] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isValid =
    title.trim().length > 0 &&
    academicYear.trim().length > 0 &&
    !fileError &&
    (mode === 'file' ? Boolean(file) : link.trim().length > 0);

  const reset = () => {
    setMode('file');
    setTitle('');
    setTitleEditedByUser(false);
    setType('SLIDES');
    setAcademicYear('2025/2026');
    setFile(null);
    setFileError(null);
    setLink('');
    setTouched(false);
    setUploading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const applySelectedFile = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      setFileError(null);
      return;
    }
    const error = validateFile(selected);
    setFileError(error);
    setFile(error ? null : selected);
    if (!error && !titleEditedByUser) setTitle(titleFromFileName(selected.name));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applySelectedFile(e.target.files?.[0] ?? null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleModeChange = (next: 'file' | 'link') => {
    setMode(next);
    setFileError(null);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setTitleEditedByUser(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || uploading) return;

    setUploading(true);
    try {
      const result = await addResource({
        title: title.trim(),
        courseId: course.id,
        type,
        academicYear: academicYear.trim(),
        file: mode === 'file' ? file ?? undefined : undefined,
        externalUrl: mode === 'link' ? link.trim() : undefined,
      });

      if (!result.ok) {
        toast(result.error, 'error');
        setUploading(false);
        return;
      }

      toast(`Uploaded "${title.trim()}" to ${course.code}.`);
      handleClose();
    } catch {
      toast('Upload could not be completed. Try again.', 'error');
      setUploading(false);
    }
  };

  const inputClass =
    'w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] placeholder-[var(--text-subtle)] text-sm outline-none focus:border-[var(--focus)]';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5';

  return (
    <Drawer open={open} onClose={handleClose} title={`Upload to ${course.code}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div role="tablist" aria-label="Resource source" className="grid grid-cols-2 gap-2 p-1 rounded-full bg-[var(--surface-2)]">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'file'}
            onClick={() => handleModeChange('file')}
            className={`min-h-11 sm:min-h-9 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'file' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            Upload file
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'link'}
            onClick={() => handleModeChange('link')}
            className={`min-h-11 sm:min-h-9 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'link' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
            Add link
          </button>
        </div>

        {mode === 'file' ? (
          <div>
            <label htmlFor={fileInputId} className={labelClass}>
              File
            </label>
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx"
              onChange={handleFileChange}
              className="sr-only"
              aria-describedby="upload-file-hint"
            />
            {!file ? (
              <label
                htmlFor={fileInputId}
                className="flex flex-col items-center justify-center gap-2 min-h-28 px-4 py-5 rounded-2xl border border-dashed border-[var(--border)] text-center cursor-pointer hover:bg-[var(--surface-2)]"
              >
                <Upload className="w-5 h-5 text-[var(--text-muted)]" aria-hidden="true" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Click to choose a file</span>
                <span id="upload-file-hint" className="text-xs text-[var(--text-subtle)]">
                  PDF, DOCX, or PPTX — up to {formatBytes(MAX_FILE_BYTES)}
                </span>
              </label>
            ) : (
              <div className="flex items-center gap-3 min-h-14 px-3.5 py-2.5 rounded-2xl bg-[var(--surface-2)]">
                <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--surface)]">
                  <FileText className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  aria-label="Remove selected file"
                  className="shrink-0 w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-3)] active:bg-[var(--surface-3)]"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
            {fileError && (
              <p className="mt-1.5 text-xs text-[var(--type-past-question)]" role="alert">
                {fileError}
              </p>
            )}
            {touched && !file && !fileError && (
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">Choose a file to upload.</p>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="upload-link" className={labelClass}>
              Link
            </label>
            <input
              id="upload-link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://drive.google.com/…"
              className={inputClass}
              aria-describedby="upload-link-hint"
            />
            <p id="upload-link-hint" className="mt-1.5 text-xs text-[var(--text-subtle)]">
              Google Drive, Google Docs, or YouTube links only.
            </p>
            {touched && !link.trim() && (
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">A link is required.</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="upload-title" className={labelClass}>
            Title
          </label>
          <input
            id="upload-title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Lecture Slides – Week 3"
            className={inputClass}
            aria-describedby="upload-title-hint"
          />
          <p id="upload-title-hint" className="mt-1.5 text-xs text-[var(--text-subtle)]">
            {mode === 'file'
              ? 'Filled in from the file name — edit it to save under a different title.'
              : 'What students will see for this link.'}
          </p>
          {touched && !title.trim() && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">Title is required.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="upload-type" className={labelClass}>
              Type
            </label>
            <select
              id="upload-type"
              value={type}
              onChange={(e) => setType(e.target.value as ResourceType)}
              className={inputClass}
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {RESOURCE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="upload-year" className={labelClass}>
              Academic year
            </label>
            <input
              id="upload-year"
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025/2026"
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full min-h-11 px-4 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-semibold disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>
    </Drawer>
  );
}
