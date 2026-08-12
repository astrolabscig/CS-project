import { z } from 'zod';
import { jsonError, requireActiveUser, validationError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { normalizeStudentEmail } from '@/lib/auth';
import { computeKnustLevel } from '@/lib/knustLevel';

export const runtime = 'nodejs';

const createUserSchema = z.object({
  email: z.string().trim().email(),
  indexNumber: z.string().trim().regex(/^\d{7}$/, 'Index number must be exactly 7 digits'),
});

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return jsonError('Authentication required', 401);
  if (user.role !== 'SUPER_ADMIN') return jsonError('Super-admin access required', 403);

  return Response.json(await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, indexNumber: true, level: true, createdAt: true, scopes: true },
    orderBy: { createdAt: 'desc' },
  }));
}

// Manual student provisioning (e.g. when magic-link delivery fails and an
// admin needs to seed the account ahead of the student's first real sign-in).
// Auth.js's PrismaAdapter looks the user up by email on verification and
// reuses this row rather than creating a duplicate.
export async function POST(request: Request) {
  const actor = await requireActiveUser();
  if (!actor) return jsonError('Authentication required', 401);
  if (actor.role !== 'SUPER_ADMIN') return jsonError('Super-admin access required', 403);

  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  let email: string;
  try {
    email = normalizeStudentEmail(parsed.data.email);
  } catch {
    return jsonError('Use a valid email address.');
  }

  const result = computeKnustLevel(parsed.data.indexNumber);
  const level = result.status === 'SUCCESS' ? result.level : null;
  const levelNotice =
    result.status === 'FUTURE_ENTRY'
      ? 'Could not compute a level yet — future entry year. An admin will need to assign it.'
      : result.status === 'BEYOND_SUPPORTED'
        ? `Computed level (${result.level}) is outside the supported range — set it manually.`
        : undefined;

  try {
    const user = await prisma.user.create({
      data: { email, indexNumber: parsed.data.indexNumber, role: 'STUDENT', level },
      select: { id: true, name: true, email: true, role: true, status: true, indexNumber: true, level: true, createdAt: true, scopes: true },
    });
    return Response.json({ ...user, levelNotice }, { status: 201 });
  } catch {
    return jsonError('A user with that email or index number already exists', 409);
  }
}
