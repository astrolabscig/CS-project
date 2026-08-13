import { getServerSession } from 'next-auth';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const levels = [100, 200, 300, 400] as const;
export const resourceTypes = ['SLIDES', 'NOTES', 'PAST_QUESTION', 'ASSIGNMENT', 'SOLUTION', 'LAB_MANUAL', 'BOOK', 'OUTLINE', 'TIMETABLE', 'LINK', 'OTHER'] as const;
export type Level = (typeof levels)[number];

export const courseInput = z.object({
  code: z.string().trim().min(3).max(30).transform((value) => value.toUpperCase()),
  title: z.string().trim().min(2).max(180),
  level: z.coerce.number().refine((value) => levels.includes(value as (typeof levels)[number]), 'Level must be 100, 200, 300, or 400'),
  semester: z.coerce.number().int().min(1).max(2),
  lecturer: z.string().trim().max(120).nullable().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});

export const resourceMetadata = z.object({
  title: z.string().trim().min(2).max(180),
  courseId: z.coerce.number().int().positive(),
  type: z.enum(resourceTypes),
  academicYear: z.string().trim().regex(/^\d{4}\/\d{4}$/, 'Use YYYY/YYYY (for example, 2024/2025)'),
  externalUrl: z.string().url().max(2048).optional(),
});

export const jsonError = (message: string, status = 400) => Response.json({ error: message }, { status });

export function validationError(error: z.ZodError) {
  return Response.json({ error: 'Invalid request data', details: error.issues }, { status: 422 });
}

export async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: { scopes: true },
  });
}

export async function canWriteCourse(userId: string, role: string, courseId: number) {
  if (role === 'SUPER_ADMIN') return true;
  if (role !== 'REP') return false;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { level: true },
  });
  if (!course) return false;

  return Boolean(await prisma.repScope.findUnique({ where: { userId_level: { userId, level: course.level } } }));
}

/** Same write-scope rule as canWriteCourse, for level-wide resources (the
 * timetable) that aren't tied to one course. */
export async function canWriteLevel(userId: string, role: string, level: number) {
  if (role === 'SUPER_ADMIN') return true;
  if (role !== 'REP') return false;
  return Boolean(await prisma.repScope.findUnique({ where: { userId_level: { userId, level } } }));
}

export async function audit(actorId: string | null | undefined, action: string, entity: string, entityId: string | number, metadata?: Prisma.InputJsonValue) {
  await prisma.auditLog.create({ data: { actorId: actorId ?? null, action, entity, entityId: String(entityId), metadata } });
}

export async function requireActiveUser() {
  const user = await currentUser();
  return user?.status === 'ACTIVE' ? user : null;
}

type ActiveUser = NonNullable<Awaited<ReturnType<typeof requireActiveUser>>>;

/** The only source of truth for resource visibility. Never accept a level from the client. */
export function readableLevels(user: ActiveUser): Level[] {
  if (user.role === 'SUPER_ADMIN') return [...levels];
  if (user.role === 'REP') return user.scopes.map((scope) => scope.level).filter((level): level is Level => levels.includes(level as Level));
  return user.level && levels.includes(user.level as Level) ? [user.level as Level] : [];
}

export function courseReadWhere(user: ActiveUser) {
  return user.role === 'SUPER_ADMIN' ? {} : { level: { in: readableLevels(user) } };
}

export function resourceReadWhere(user: ActiveUser) {
  return user.role === 'SUPER_ADMIN' ? {} : { course: { level: { in: readableLevels(user) } } };
}

export function canReadLevel(user: ActiveUser, level: number) {
  return readableLevels(user).includes(level as Level);
}

export function safeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return host === 'drive.google.com' || host === 'docs.google.com' || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be';
  } catch {
    return false;
  }
}

export function parseId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
