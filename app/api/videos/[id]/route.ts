import { z } from 'zod';
import { audit, canWriteCourse, jsonError, parseId, requireActiveUser, validationError } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
const patchSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });

// Approve/reject is the only trust guardrail here — a video only ever
// reaches students after a human in the video's own course scope confirms
// it (design doc: no auto-publish under any circumstance).
export async function PATCH(request: Request, { params }: Context) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);

  const id = parseId((await params).id);
  if (!id) return jsonError('Invalid video id', 404);

  const video = await prisma.recommendedVideo.findUnique({ where: { id } });
  if (!video || !await canWriteCourse(user.id, user.role, video.courseId)) return jsonError('Video not found or you do not have access', 404);
  if (video.status !== 'SUGGESTED') return jsonError('This video has already been reviewed');

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const updated = await prisma.recommendedVideo.update({
    where: { id: video.id },
    data:
      parsed.data.status === 'APPROVED'
        ? { status: 'APPROVED', approvedById: user.id, approvedAt: new Date() }
        : { status: 'REJECTED' },
  });
  await audit(user.id, parsed.data.status === 'APPROVED' ? 'VIDEO_APPROVED' : 'VIDEO_REJECTED', 'RecommendedVideo', updated.id, { courseId: video.courseId });

  return Response.json(updated);
}
