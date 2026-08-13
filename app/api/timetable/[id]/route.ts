import { z } from 'zod';
import { audit, canWriteLevel, jsonError, parseId, requireActiveUser, validationError } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };

const editSchema = z.object({
  academicPeriod: z.string().trim().min(2).max(60).optional(),
  courseCode: z.string().trim().min(1).max(30).optional(),
  courseTitle: z.string().trim().min(1).max(180).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24h HH:MM').optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24h HH:MM').optional(),
  venue: z.string().trim().max(80).nullable().optional(),
});

async function editableSession(rawId: string, user: Awaited<ReturnType<typeof requireActiveUser>>) {
  const id = parseId(rawId);
  if (!id || !user) return null;
  const session = await prisma.classSession.findUnique({ where: { id } });
  if (!session || !await canWriteLevel(user.id, user.role, session.levelScope)) return null;
  return session;
}

// Inline corrections on the review screen — used on both DRAFT rows
// (pre-publish review) and PUBLISHED rows (fixing a mistake after the
// fact), same scope check either way.
export async function PATCH(request: Request, { params }: Context) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);
  const { id } = await params;
  const session = await editableSession(id, user);
  if (!session) return jsonError('Session not found or you do not have access', 404);

  const parsed = editSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  if (Object.keys(parsed.data).length === 0) return jsonError('Provide at least one field to update');

  const nextStart = parsed.data.startTime ?? session.startTime;
  const nextEnd = parsed.data.endTime ?? session.endTime;
  if (nextEnd <= nextStart) return jsonError('End time must be after start time');

  const { date, ...rest } = parsed.data;
  const updated = await prisma.classSession.update({
    where: { id: session.id },
    data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
  });
  await audit(user.id, 'CLASS_SESSION_UPDATED', 'ClassSession', updated.id, { levelScope: session.levelScope });

  return Response.json(updated);
}

// Hard delete, not soft — these rows carry no download/audit weight of their
// own once removed (unlike Resource/RecommendedVideo), so there's nothing
// worth keeping a tombstone for.
export async function DELETE(_: Request, { params }: Context) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);
  const { id } = await params;
  const session = await editableSession(id, user);
  if (!session) return jsonError('Session not found or you do not have access', 404);

  await prisma.classSession.delete({ where: { id: session.id } });
  await audit(user.id, 'CLASS_SESSION_DELETED', 'ClassSession', session.id, { levelScope: session.levelScope });

  return Response.json({ ok: true });
}
