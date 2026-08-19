import { audit, canReadLevel, jsonError, parseId, requireActiveUser, validationError, courseInput } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { deleteResourceFile } from '@/lib/storage';

export const runtime = 'nodejs';

type Context = { params: Promise<{ code: string }> };

export async function GET(_: Request, { params }: Context) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);
  const { code } = await params;
  const course = await prisma.course.findUnique({
    where: { code: decodeURIComponent(code).toUpperCase() },
    include: { _count: { select: { resources: { where: { status: 'ACTIVE' } } } }, department: true },
  });
  if (!course) return jsonError('Course not found', 404);
  if (!canReadLevel(user, course.level)) return jsonError('Course not found', 404);
  const { _count, ...result } = course;
  return Response.json({ ...result, resourceCount: _count.resources });
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);
  if (user.role !== 'SUPER_ADMIN') return jsonError('Super-admin access required', 403);
  const { code } = await params;
  const parsed = courseInput.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  if (Object.keys(parsed.data).length === 0) return jsonError('Provide at least one field to update');
  try {
    const where = parseId(code) ? { id: parseId(code)! } : { code: decodeURIComponent(code).toUpperCase() };
    return Response.json(await prisma.course.update({ where, data: parsed.data }));
  } catch {
    return jsonError('Course not found or course code already exists', 404);
  }
}

// Hard-deletes the course and everything attached to it (resources — files
// and all — and recommended videos). Unlike Resource/User, Course has no
// soft-delete status field; this is a deliberate, irreversible admin action
// for removing a mistaken/duplicate catalog entry, not a routine takedown.
export async function DELETE(_: Request, { params }: Context) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);
  if (user.role !== 'SUPER_ADMIN') return jsonError('Super-admin access required', 403);

  const { code } = await params;
  const where = parseId(code) ? { id: parseId(code)! } : { code: decodeURIComponent(code).toUpperCase() };
  const course = await prisma.course.findUnique({
    where,
    include: { resources: { select: { id: true, storageKey: true } }, recommendedVideos: { select: { id: true } } },
  });
  if (!course) return jsonError('Course not found', 404);

  for (const resource of course.resources) {
    if (resource.storageKey) await deleteResourceFile(resource.storageKey).catch(() => undefined);
  }

  await prisma.$transaction([
    prisma.recommendedVideo.deleteMany({ where: { courseId: course.id } }),
    prisma.resource.deleteMany({ where: { courseId: course.id } }),
    prisma.course.delete({ where: { id: course.id } }),
  ]);
  await audit(user.id, 'COURSE_DELETED', 'Course', course.id, {
    code: course.code,
    resourceCount: course.resources.length,
    videoCount: course.recommendedVideos.length,
  });

  return Response.json({ ok: true });
}
