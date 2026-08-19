'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/clientApi';
import { formatBytes } from '@/lib/upload';
import { useSession } from './SessionProvider';
import type {
  Course,
  Level,
  MaterialRequest,
  MockUser,
  MutationResult,
  RequestStatus,
  Resource,
  ResourceType,
  Role,
  Semester,
  UserStatus,
} from '@/types/resource';

interface ApiCourse {
  id: number;
  code: string;
  title: string;
  level: number;
  semester: number;
  lecturer: string | null;
  resourceCount: number;
}

interface ApiResource {
  id: number;
  title: string;
  type: ResourceType;
  academicYear: string;
  fileSize: number | null;
  mimeType: string | null;
  externalUrl: string | null;
  status: 'ACTIVE' | 'REMOVED';
  downloadCount: number;
  uploadedById: string;
  createdAt: string;
  course: { code: string; title: string; level: number; semester: number };
}

interface ApiUser {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  indexNumber: string | null;
  level: number | null;
  scopes: { level: number }[];
}

interface ApiRequest {
  id: number;
  courseCode: string | null;
  note: string;
  status: RequestStatus;
}

function toCourse(c: ApiCourse): Course {
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    level: c.level as Level,
    semester: c.semester as Semester,
    lecturer: c.lecturer ?? undefined,
    resourceCount: c.resourceCount,
  };
}

function toResource(r: ApiResource): Resource {
  return {
    id: String(r.id),
    title: r.title,
    courseCode: r.course.code,
    courseTitle: r.course.title,
    level: r.course.level,
    semester: r.course.semester,
    type: r.type,
    academicYear: r.academicYear,
    fileSize: r.fileSize != null ? formatBytes(r.fileSize) : undefined,
    mimeType: r.mimeType ?? undefined,
    externalUrl: r.externalUrl ?? undefined,
    status: r.status,
    downloadCount: r.downloadCount,
    uploadedBy: r.uploadedById,
    createdAt: r.createdAt,
  };
}

function toUser(u: ApiUser): MockUser {
  const level = u.role === 'REP' ? u.scopes[0]?.level ?? null : u.level ?? null;
  return {
    id: u.id,
    email: u.email,
    name: u.name || u.email.split('@')[0],
    role: u.role,
    level: level as Level | null,
    indexNumber: u.indexNumber || '',
    status: u.status,
  };
}

function toRequest(r: ApiRequest): MaterialRequest {
  return { id: String(r.id), courseCode: r.courseCode ?? undefined, note: r.note, status: r.status };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

interface LibraryContextValue {
  courses: Course[];
  resources: Resource[];
  users: MockUser[];
  requests: MaterialRequest[];
  loading: boolean;
  addCourse: (input: { code: string; title: string; level: Level; semester: Semester; lecturer?: string }) => Promise<MutationResult>;
  updateCourse: (code: string, patch: Partial<{ title: string; lecturer?: string; level: Level; semester: Semester }>) => Promise<MutationResult>;
  removeCourse: (code: string) => Promise<MutationResult>;
  addResource: (input: { courseId: number; title: string; type: ResourceType; academicYear: string; file?: File; externalUrl?: string }) => Promise<MutationResult>;
  removeResource: (id: string) => Promise<MutationResult>;
  updateUser: (
    user: MockUser,
    patch: Partial<Pick<MockUser, 'role' | 'level' | 'status'>> & { recalculateLevel?: boolean }
  ) => Promise<MutationResult>;
  addStudent: (input: { email: string; indexNumber: string }) => Promise<MutationResult & { levelNotice?: string }>;
  addRequest: (input: { courseCode?: string; note: string }) => Promise<MutationResult>;
  updateRequestStatus: (id: string, status: RequestStatus) => Promise<MutationResult>;
  refresh: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

// Reads (courses, resources) come straight from the server, which already
// enforces the read-scope gate (design doc §3, lib/api.ts). Mutations post to
// the same Appendix B endpoints and then refetch, so the client never trusts
// its own optimistic view of scope/permissions — only what the server allows.
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!session) {
      setCourses([]);
      setResources([]);
      setUsers([]);
      setRequests([]);
      return;
    }
    try {
      const [courseData, resourceData] = await Promise.all([
        api<ApiCourse[]>('/api/courses'),
        api<ApiResource[]>('/api/resources?scope=readable'),
      ]);
      setCourses(courseData.map(toCourse));
      setResources(resourceData.map(toResource));
    } catch {
      setCourses([]);
      setResources([]);
    }

    if (session.role === 'SUPER_ADMIN') {
      try {
        const [userData, requestData] = await Promise.all([
          api<ApiUser[]>('/api/users'),
          api<ApiRequest[]>('/api/requests'),
        ]);
        setUsers(userData.map(toUser));
        setRequests(requestData.map(toRequest));
      } catch {
        setUsers([]);
        setRequests([]);
      }
    } else {
      setUsers([]);
      setRequests([]);
    }
  }, [session]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      await refresh();
      if (!ignore) setReady(true);
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [refresh]);

  const addCourse = useCallback(
    async (input: { code: string; title: string; level: Level; semester: Semester; lecturer?: string }): Promise<MutationResult> => {
      try {
        await api('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        await refresh();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, 'Could not add course.') };
      }
    },
    [refresh]
  );

  const updateCourse = useCallback(
    async (code: string, patch: Partial<{ title: string; lecturer?: string; level: Level; semester: Semester }>): Promise<MutationResult> => {
      try {
        await api(`/api/courses/${encodeURIComponent(code)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        await refresh();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, 'Could not save course.') };
      }
    },
    [refresh]
  );

  const removeCourse = useCallback(
    async (code: string): Promise<MutationResult> => {
      try {
        await api(`/api/courses/${encodeURIComponent(code)}`, { method: 'DELETE' });
        await refresh();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, 'Could not delete course.') };
      }
    },
    [refresh]
  );

  const addResource = useCallback(
    async (input: { courseId: number; title: string; type: ResourceType; academicYear: string; file?: File; externalUrl?: string }): Promise<MutationResult> => {
      try {
        const formData = new FormData();
        formData.set('title', input.title);
        formData.set('courseId', String(input.courseId));
        formData.set('type', input.type);
        formData.set('academicYear', input.academicYear);
        if (input.file) formData.set('file', input.file);
        if (input.externalUrl) formData.set('externalUrl', input.externalUrl);
        await api('/api/resources', { method: 'POST', body: formData });
        await refresh();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, 'Upload could not be completed.') };
      }
    },
    [refresh]
  );

  const removeResource = useCallback(
    async (id: string): Promise<MutationResult> => {
      try {
        await api(`/api/resources/${id}`, { method: 'DELETE' });
        await refresh();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, 'Could not remove resource.') };
      }
    },
    [refresh]
  );

  const updateUser = useCallback(
    async (
      user: MockUser,
      patch: Partial<Pick<MockUser, 'role' | 'level' | 'status'>> & { recalculateLevel?: boolean }
    ): Promise<MutationResult> => {
      const body: Record<string, unknown> = {};
      if (patch.status) body.status = patch.status;
      if (patch.role) body.role = patch.role;
      if (patch.recalculateLevel) body.recalculateLevel = true;
      const effectiveRole = patch.role ?? user.role;
      if (patch.level !== undefined) {
        if (effectiveRole === 'REP') body.levels = [patch.level];
        else body.level = patch.level;
      }
      try {
        await api(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        await refresh();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, 'Could not update user.') };
      }
    },
    [refresh]
  );

  const addStudent = useCallback(
    async (input: { email: string; indexNumber: string }): Promise<MutationResult & { levelNotice?: string }> => {
      try {
        const created = await api<{ levelNotice?: string }>('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        await refresh();
        return { ok: true, levelNotice: created.levelNotice };
      } catch (error) {
        return { ok: false, error: errorMessage(error, 'Could not add student.') };
      }
    },
    [refresh]
  );

  const addRequest = useCallback(
    async (input: { courseCode?: string; note: string }): Promise<MutationResult> => {
      try {
        await api('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        await refresh();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, 'Could not send request.') };
      }
    },
    [refresh]
  );

  const updateRequestStatus = useCallback(
    async (id: string, status: RequestStatus): Promise<MutationResult> => {
      try {
        await api(`/api/requests/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        await refresh();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, 'Could not update request.') };
      }
    },
    [refresh]
  );

  const value: LibraryContextValue = {
    courses,
    resources,
    users,
    requests,
    loading: !ready,
    addCourse,
    updateCourse,
    removeCourse,
    addResource,
    removeResource,
    updateUser,
    addStudent,
    addRequest,
    updateRequestStatus,
    refresh,
  };

  // Same guard as the theme script / session provider: don't render
  // stateful UI until the first load has settled, to avoid a flash of
  // empty data replaced by fetched data.
  if (!ready) {
    return <div className="min-h-screen bg-[var(--bg)]" />;
  }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return ctx;
}
