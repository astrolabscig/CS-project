import { z } from 'zod';
import { audit, canWriteLevel, jsonError, levels, requireActiveUser, validationError } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const bodySchema = z.object({
  level: z.coerce.number().refine((value) => levels.includes(value as (typeof levels)[number])),
});

// The confirm step of the review workflow — the only way a DRAFT row ever
// becomes visible to students. Never triggered automatically.
export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  if (!await canWriteLevel(user.id, user.role, parsed.data.level)) return jsonError('You cannot publish this level\'s timetable', 403);

  const result = await prisma.classSession.updateMany({
    where: { levelScope: parsed.data.level, status: 'DRAFT' },
    data: { status: 'PUBLISHED' },
  });
  if (result.count > 0) {
    await audit(user.id, 'TIMETABLE_PUBLISHED', 'Level', parsed.data.level, { count: result.count });
  }

  return Response.json({ published: result.count });
}
