import { audit, canReadLevel, canWriteCourse, canWriteLevel, jsonError, parseId, requireActiveUser, validationError, courseInput } from '@/lib/api';
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

// Reps may edit (including renaming the code of) a course, same scope as
// their upload write-access — not just super-admins. A rep can only touch a
// course already within their assigned level(s), and if the edit itself
// moves the course to a different level, that target level must also be
// within their scope (mirrors the same rule POST /api/courses applies).
export async function PATCH(request: Request, { params }: Context) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'REP') return jsonError('Rep or super-admin access required', 403);

  const { code } = await params;
  const where = parseId(code) ? { id: parseId(code)! } : { code: decodeURIComponent(code).toUpperCase() };
  const course = await prisma.course.findUnique({ where, select: { id: true, level: true } });
  if (!course) return jsonError('Course not found', 404);
  if (!await canWriteCourse(user.id, user.role, course.id)) return jsonError('You cannot edit this course', 403);

  const parsed = courseInput.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  if (Object.keys(parsed.data).length === 0) return jsonError('Provide at least one field to update');
  if (parsed.data.level !== undefined && !await canWriteLevel(user.id, user.role, parsed.data.level)) {
    return jsonError('You can only move a course to your assigned level(s)', 403);
  }

  try {
    const updated = await prisma.course.update({ where: { id: course.id }, data: parsed.data });
    await audit(user.id, 'COURSE_UPDATED', 'Course', updated.id, { fields: Object.keys(parsed.data), byRole: user.role });
    return Response.json(updated);
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
