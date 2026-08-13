import { z } from 'zod';
import { canReadLevel, canWriteCourse, jsonError, requireActiveUser, validationError } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
type Context = { params: Promise<{ code: string }> };
const querySchema = z.object({ status: z.enum(['suggested']).optional() });

// APPROVED videos follow the same read-scope rule as resources (student/rep
// own level, super-admin all — design doc §3). The SUGGESTED review queue is
// only ever returned to a rep/admin who can write to this course.
export async function GET(request: Request, { params }: Context) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return validationError(query.error);

  const { code } = await params;
  const course = await prisma.course.findUnique({ where: { code: decodeURIComponent(code).toUpperCase() }, select: { id: true, level: true } });
  if (!course) return jsonError('Course not found', 404);
  if (!canReadLevel(user, course.level)) return jsonError('Course not found', 404);

  if (query.data.status === 'suggested') {
    if (!await canWriteCourse(user.id, user.role, course.id)) return jsonError('You cannot review videos for this course', 403);
    return Response.json(await prisma.recommendedVideo.findMany({
      where: { courseId: course.id, status: 'SUGGESTED' },
      orderBy: { qualityScore: 'desc' },
    }));
  }

  return Response.json(await prisma.recommendedVideo.findMany({
    where: { courseId: course.id, status: 'APPROVED' },
    orderBy: { approvedAt: 'desc' },
  }));
}
