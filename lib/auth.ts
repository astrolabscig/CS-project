import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from '@/lib/prisma';
import { sendVerificationRequest } from '@/lib/authEmail';

export const STUDENT_EMAIL_DOMAIN = '@st.knust.edu.gh';

// Gmail is the primary sign-in domain for now — KNUST mail delivery isn't
// reliable yet, so students are steered to Gmail rather than their KNUST
// inbox. The KNUST domain stays accepted so it keeps working once that's fixed.
const ALLOWED_EMAIL_DOMAINS = [STUDENT_EMAIL_DOMAIN, '@gmail.com'];

export function normalizeStudentEmail(identifier: string) {
  const email = identifier.trim().toLowerCase();
  const at = email.lastIndexOf('@');
  if (at <= 0 || email.indexOf('@') !== at || !ALLOWED_EMAIL_DOMAINS.some((domain) => email.endsWith(domain))) {
    throw new Error('Use a valid email address.');
  }
  return email;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      // EMAIL_SERVER accepts a standard nodemailer connection URL, matching
      // the documented deployment environment. Support both the EMAIL_SERVER_*
      // names and the EMAIL_* names supplied by this project's .env template.
      server: process.env.EMAIL_SERVER ?? {
        host: process.env.EMAIL_SERVER_HOST ?? process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? process.env.EMAIL_PORT ?? 465),
        auth: {
          user: process.env.EMAIL_SERVER_USER ?? process.env.EMAIL_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD ?? process.env.EMAIL_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60,
      normalizeIdentifier: normalizeStudentEmail,
      sendVerificationRequest,
    }),
  ],
  session: { strategy: 'database', maxAge: 60 * 60 * 24 * 90, updateAge: 60 * 60 * 24 },
  callbacks: {
    async signIn({ user }: { user: { email?: string | null } }) {
      let email: string;
      try {
        if (!user.email) return false;
        email = normalizeStudentEmail(user.email);
      } catch {
        return false;
      }
      const existing = await prisma.user.findUnique({ where: { email }, select: { status: true } });
      return !existing || existing.status === 'ACTIVE';
    },
  },
  pages: { signIn: '/sign-in' },
};
