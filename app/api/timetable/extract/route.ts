import { z } from 'zod';
import { audit, canWriteLevel, jsonError, levels, requireActiveUser } from '@/lib/api';
import { validateTimetableFile } from '@/lib/fileValidation';
import { GeminiApiError, extractTimetableFromFile } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { allowRequest } from '@/lib/rateLimit';
import { uploadResourceFile } from '@/lib/storage';

export const runtime = 'nodejs';

// One extraction run per level every 5 minutes — mirrors the video-suggest
// cooldown: a client-side disable plus this server-side backstop against
// accidentally burning the Gemini quota.
const EXTRACT_COOLDOWN_MS = 5 * 60 * 1000;

const metaSchema = z.object({
  levelScope: z.coerce.number().refine((value) => levels.includes(value as (typeof levels)[number])),
  academicPeriod: z.string().trim().min(2).max(60),
});

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);

  const formData = await request.formData().catch(() => null);
  if (!formData) return jsonError('Expected multipart form data');
  const file = formData.get('file');
  if (!(file instanceof File)) return jsonError('Expected a file upload');

  const parsedMeta = metaSchema.safeParse({
    levelScope: formData.get('levelScope'),
    academicPeriod: formData.get('academicPeriod'),
  });
  if (!parsedMeta.success) return jsonError('Provide a valid level and academic period');
  const { levelScope, academicPeriod } = parsedMeta.data;

  if (!await canWriteLevel(user.id, user.role, levelScope)) return jsonError('You cannot upload a timetable for this level', 403);

  if (!allowRequest(`timetable-extract:level:${levelScope}`, 1, EXTRACT_COOLDOWN_MS)) {
    return jsonError('A timetable was just uploaded for this level — try again in a few minutes.', 429);
  }

  const fileError = await validateTimetableFile(file);
  if (fileError) return jsonError(fileError);

  // The uploaded file is kept regardless of whether AI extraction below
  // succeeds — it's the reference copy students (and the rep, on a
  // re-upload) can always fall back to.
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
  const storageKey = `timetables/${levelScope}/${crypto.randomUUID()}-${safeName}`;
  let upload: Awaited<ReturnType<typeof prisma.timetableUpload.create>>;
  try {
    await uploadResourceFile(storageKey, file);
    upload = await prisma.timetableUpload.create({
      data: {
        levelScope,
        academicPeriod,
        storageKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: user.id,
      },
    });
  } catch (error) {
    console.error('Timetable file upload failed', error);
    return jsonError('Upload could not be completed', 503);
  }
  await audit(user.id, 'TIMETABLE_UPLOADED', 'TimetableUpload', upload.id, { levelScope, academicPeriod });

  let rows;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    rows = await extractTimetableFromFile(bytes, file.type, levelScope, academicPeriod);
  } catch (error) {
    const message =
      error instanceof GeminiApiError ? error.message : "Couldn't read this timetable — try a clearer photo or enter manually.";
    console.error('Timetable extraction failed', error);
    // The file is already saved (see above) — extraction failure only means
    // no DRAFT rows were created, never a broken upload or a crashed page.
    return jsonError(message, 502);
  }

  if (rows.length === 0) {
    return Response.json({
      created: 0,
      uploadId: upload.id,
      message: "We couldn't confidently read this timetable — please add sessions manually, or try a clearer upload.",
    });
  }

  const created = await prisma.$transaction(
    rows.map((row) =>
      prisma.classSession.create({
        data: {
          levelScope,
          academicPeriod,
          courseCode: row.courseCode,
          courseTitle: row.courseTitle,
          date: new Date(row.date),
          startTime: row.startTime,
          endTime: row.endTime,
          venue: row.venue || undefined,
          status: 'DRAFT',
          sourceUploadId: upload.id,
          createdById: user.id,
        },
      })
    )
  );
  await audit(user.id, 'TIMETABLE_EXTRACTED', 'TimetableUpload', upload.id, { count: created.length });

  return Response.json({ created: created.length, uploadId: upload.id, sessions: created });
}
