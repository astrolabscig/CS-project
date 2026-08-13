import { z } from 'zod';
import { audit, canWriteCourse, jsonError, requireActiveUser, validationError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { allowRequest } from '@/lib/rateLimit';
import { YoutubeApiError, suggestVideosForCourse } from '@/lib/youtube';

export const runtime = 'nodejs';
type Context = { params: Promise<{ code: string }> };

// One suggest run per course every 5 minutes — the button also disables
// client-side, this is the server-side backstop against spamming the
// YouTube quota (design doc §5).
const SUGGEST_COOLDOWN_MS = 5 * 60 * 1000;

const bodySchema = z.object({ topic: z.string().trim().min(2).max(120).optional() });

export async function POST(request: Request, { params }: Context) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);

  const parsedBody = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) return validationError(parsedBody.error);
  const topic = parsedBody.data.topic;

  const { code } = await params;
  const course = await prisma.course.findUnique({
    where: { code: decodeURIComponent(code).toUpperCase() },
    select: { id: true, code: true, title: true },
  });
  if (!course) return jsonError('Course not found', 404);
  if (!await canWriteCourse(user.id, user.role, course.id)) return jsonError('You cannot suggest videos for this course', 403);

  if (!allowRequest(`video-suggest:course:${course.id}`, 1, SUGGEST_COOLDOWN_MS)) {
    return jsonError('Suggestions were just refreshed for this course — try again in a few minutes.', 429);
  }

  // A rep-entered topic narrows the search to that specific concept within
  // the course; otherwise fall back to the course title/code plus its most
  // recent resource titles as a general-purpose query.
  let query: string;
  if (topic) {
    query = [topic, course.title].join(' ');
  } else {
    const topResources = await prisma.resource.findMany({
      where: { courseId: course.id, status: 'ACTIVE' },
      select: { title: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    query = [course.title, course.code, ...topResources.map((r) => r.title)].join(' ');
  }

  const existing = await prisma.recommendedVideo.findMany({ where: { courseId: course.id }, select: { videoId: true } });
  const excludeVideoIds = existing.map((v) => v.videoId);

  let suggestions;
  try {
    suggestions = await suggestVideosForCourse(query, excludeVideoIds);
  } catch (error) {
    const message = error instanceof YoutubeApiError ? error.message : 'Could not fetch suggestions right now — try again later.';
    console.error('YouTube suggest failed', error);
    return jsonError(message, 502);
  }

  if (suggestions.length === 0) {
    return Response.json({ created: 0, videos: [] });
  }

  const created = await prisma.$transaction(
    suggestions.map((s) =>
      prisma.recommendedVideo.create({
        data: {
          courseId: course.id,
          title: s.title,
          youtubeUrl: s.youtubeUrl,
          videoId: s.videoId,
          channelName: s.channelName,
          thumbnailUrl: s.thumbnailUrl,
          viewCount: s.viewCount,
          likeCount: s.likeCount,
          qualityScore: s.qualityScore,
          suggestedById: user.id,
        },
      })
    )
  );
  await audit(user.id, 'VIDEOS_SUGGESTED', 'Course', course.id, { count: created.length, topic: topic ?? null });

  return Response.json({ created: created.length, videos: created });
}
