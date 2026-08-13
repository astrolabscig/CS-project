import { z } from 'zod';
import { canWriteLevel, jsonError, levels, readableLevels, requireActiveUser, validationError } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const levelSchema = z.coerce.number().refine((value) => levels.includes(value as (typeof levels)[number]));
const querySchema = z.object({ level: levelSchema.optional(), status: z.enum(['draft']).optional() });

const manualRowSchema = z.object({
  levelScope: levelSchema,
  academicPeriod: z.string().trim().min(2).max(60),
  courseCode: z.string().trim().min(1).max(30),
  courseTitle: z.string().trim().min(1).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24h HH:MM'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24h HH:MM'),
  venue: z.string().trim().max(80).optional(),
});

// PUBLISHED rows follow the same read-scope rule as everything else
// (student/rep own level, super-admin all — clamped to the requested level
// if one is given). The DRAFT review queue is only ever returned to a
// rep/admin who can write to that level.
export async function GET(request: Request) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return validationError(query.error);

  if (query.data.status === 'draft') {
    if (!query.data.level) return jsonError('A level is required to review its draft timetable');
    if (!await canWriteLevel(user.id, user.role, query.data.level)) return jsonError('You cannot review this level\'s timetable', 403);
    return Response.json(await prisma.classSession.findMany({
      where: { levelScope: query.data.level, status: 'DRAFT' },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }));
  }

  const scopeLevels = readableLevels(user);
  const targetLevels = query.data.level ? scopeLevels.filter((l) => l === query.data.level) : scopeLevels;
  if (targetLevels.length === 0) return Response.json([]);

  return Response.json(await prisma.classSession.findMany({
    where: { status: 'PUBLISHED', levelScope: { in: targetLevels } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  }));
}

// Manual "add row" for anything AI missed — lands as DRAFT just like an
// extracted row, so it goes through the same review/publish confirmation.
export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);

  const parsed = manualRowSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  if (parsed.data.endTime <= parsed.data.startTime) return jsonError('End time must be after start time');
  if (!await canWriteLevel(user.id, user.role, parsed.data.levelScope)) return jsonError('You cannot edit this level\'s timetable', 403);

  const session = await prisma.classSession.create({
    data: { ...parsed.data, date: new Date(parsed.data.date), status: 'DRAFT', createdById: user.id },
  });

  return Response.json(session, { status: 201 });
}
