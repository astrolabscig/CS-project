import { canReadLevel, jsonError, parseId, requireActiveUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { signedDownloadUrl } from '@/lib/storage';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };

// Reference link back to the original uploaded timetable file — same
// read-scope rule as everything else (own level for student/rep, any level
// for super-admin).
export async function GET(_: Request, { params }: Context) {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return jsonError('Invalid upload id');

  const upload = await prisma.timetableUpload.findUnique({ where: { id } });
  if (!upload) return jsonError('File not found', 404);
  if (!canReadLevel(user, upload.levelScope)) return jsonError('File not found', 404);

  try {
    const url = await signedDownloadUrl(upload.storageKey, upload.fileName, upload.mimeType);
    return Response.redirect(url, 302);
  } catch (error) {
    console.error('Timetable signed URL creation failed', error);
    return jsonError('Download is temporarily unavailable', 503);
  }
}
