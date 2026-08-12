import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  BookOpen,
  Download,
  FileQuestion,
  FileStack,
  FlaskConical,
  Lock,
  NotebookText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import AppLogo from './AppLogo';
import Reveal from './Reveal';
import HeroCharacter from './HeroCharacter';

const FEATURES = [
  {
    icon: Lock,
    title: 'Verified sign-in, always',
    body: 'Sign in with your email. No passwords to leak, no outsiders in the room — just a magic link to your own inbox.',
  },
  {
    icon: Search,
    title: 'Find it in one search',
    body: 'Course code, title, resource name, type, or year — search filters structured data instead of scrolling a chat history back to 2023.',
  },
  {
    icon: FileStack,
    title: 'Organised the way you think',
    body: 'Level → Semester → Course → Resources. Three taps from sign-in to the exact past question you need.',
  },
  {
    icon: Download,
    title: 'Downloads you can trust',
    body: 'Every file shows its size before you spend the data, and every link is a short-lived signed URL — never a dead Drive link.',
  },
  {
    icon: Users,
    title: 'Kept alive by course reps',
    body: "The people who already collect your class's materials upload them here — scoped to their own level, audited, easy to rotate yearly.",
  },
  {
    icon: BellRing,
    title: "Missing something? Say so",
    body: 'One tap files a material request. Reps and admins see exactly what students are still searching for.',
  },
];

const STEPS = [
  { title: 'Sign in', body: 'One magic link to your email — no password to remember or forget.' },
  { title: 'Land on your level', body: 'Students and reps see only their own level. Nothing to filter past.' },
  { title: 'Open a course', body: 'Pick a semester, pick a course, see every resource ever uploaded to it.' },
  { title: 'Download & go', body: 'File size up front, signed link, done. Back to studying, not searching.' },
];

const ROLES = [
  {
    icon: BookOpen,
    title: 'Student',
    body: 'Read and download everything in your own level. That’s it — and that’s all you need.',
  },
  {
    icon: Users,
    title: 'Course Rep',
    body: 'Everything a student can do, plus uploading — scoped strictly to the level you represent.',
  },
  {
    icon: ShieldCheck,
    title: 'Super Admin',
    body: 'Full oversight across every level: manage courses, grant rep access, moderate content.',
  },
];

const TYPE_CHIPS: { label: string; icon: typeof FileStack; token: string; soft: string }[] = [
  { label: 'Slides', icon: FileStack, token: '--type-slides', soft: '--type-slides-soft' },
  { label: 'Notes', icon: NotebookText, token: '--type-notes', soft: '--type-notes-soft' },
  { label: 'Past Question', icon: FileQuestion, token: '--type-past-question', soft: '--type-past-question-soft' },
  { label: 'Lab Manual', icon: FlaskConical, token: '--type-lab-manual', soft: '--type-lab-manual-soft' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] overflow-x-hidden">
      {/* Nav ---------------------------------------------------------- */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 sm:px-8 bg-[var(--topbar-bg)]/85 backdrop-blur-md border-b border-[var(--border)]">
        <Link href="/" aria-label="CS Resource Hub home">
          <AppLogo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="px-4 min-h-11 flex items-center rounded-full text-sm font-semibold bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_1px_2px_var(--shadow)] transition-transform hover:-translate-y-0.5"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero ----------------------------------------------------------- */}
      <section className="relative px-4 sm:px-8 pt-14 pb-20 sm:pt-20 sm:pb-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full blur-3xl animate-glow"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent) 35%, transparent) 0%, color-mix(in srgb, var(--type-slides) 20%, transparent) 45%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          <Reveal className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Built for KNUST Computer Science
            </span>

            <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] text-[var(--text-primary)]">
              Every slide, past question,
              <br className="hidden sm:block" /> and note —{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, var(--accent), var(--type-slides))' }}
              >
                one search away.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base sm:text-lg leading-7 text-[var(--text-muted)]">
              Stop scrolling WhatsApp groups back to 2023. Every level, semester, and course
              in one searchable library — verified students only, kept filled by the course
              reps who already do the work.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-in"
                className="group inline-flex items-center gap-2 min-h-12 px-6 rounded-full text-sm font-semibold bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_1px_2px_var(--shadow),0_16px_32px_-12px_var(--shadow)] transition-transform hover:-translate-y-0.5"
              >
                Sign in with email
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center min-h-12 px-6 rounded-full text-sm font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] shadow-[0_1px_2px_var(--shadow)] transition-colors hover:bg-[var(--surface-3)]"
              >
                See how it works
              </a>
            </div>

            <p className="mt-6 text-xs text-[var(--text-subtle)]">
              No passwords. No public access. Just your own mailbox.
            </p>
          </Reveal>

          {/* Floating product mockup, with a waving student peeking out from
              behind it ------------------------------------------------- */}
          <Reveal delayMs={150} className="relative mx-auto w-full max-w-sm min-w-0">
            <HeroCharacter className="pointer-events-none absolute -left-6 sm:-left-14 bottom-2 w-32 sm:w-44 h-auto -z-10" />
            <div className="relative animate-float">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_1px_2px_var(--shadow),0_32px_60px_-16px_var(--shadow)] rotate-[-2deg]">
                <div className="flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-3 py-2">
                  <Search className="w-3.5 h-3.5 text-[var(--text-subtle)]" aria-hidden="true" />
                  <span className="text-xs text-[var(--text-subtle)]">CSM 251 — Data Structures</span>
                </div>

                <div className="mt-3 space-y-2">
                  {[
                    { label: 'Slides', title: 'Trees & Balanced BSTs — Week 6', token: '--type-slides', soft: '--type-slides-soft' },
                    { label: 'Past Question', title: '2024/2025 Mid-Semester Exam', token: '--type-past-question', soft: '--type-past-question-soft' },
                    { label: 'Lab Manual', title: 'Lab 4 — Heaps & Priority Queues', token: '--type-lab-manual', soft: '--type-lab-manual-soft' },
                  ].map((row) => (
                    <div
                      key={row.title}
                      className="flex items-center gap-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-2.5 py-2 shadow-[0_1px_2px_var(--shadow)]"
                    >
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{
                          color: `var(${row.token})`,
                          backgroundColor: `var(${row.soft})`,
                        }}
                      >
                        {row.label}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--text-primary)]">
                        {row.title}
                      </span>
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center">
                        <Download className="w-3 h-3" aria-hidden="true" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge chips */}
              <div
                className="absolute -top-5 -right-4 sm:-right-8 animate-float rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[0_1px_2px_var(--shadow),0_16px_32px_-12px_var(--shadow)]"
                style={{ animationDelay: '0.6s' }}
              >
                <div className="flex items-center gap-1.5 text-[var(--type-notes)]">
                  <NotebookText className="w-4 h-4" aria-hidden="true" />
                  <span className="text-[11px] font-semibold">Notes uploaded</span>
                </div>
              </div>

              <div
                className="absolute -bottom-6 -left-4 sm:-left-8 animate-float rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[0_1px_2px_var(--shadow),0_16px_32px_-12px_var(--shadow)]"
                style={{ animationDelay: '1.2s' }}
              >
                <div className="flex items-center gap-1.5 text-[var(--accent)]">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span className="text-[11px] font-semibold">Level-scoped access</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Problem / solution ---------------------------------------------- */}
      <section className="px-4 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <Reveal className="rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">The old way</p>
            <h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
              &ldquo;Does anyone have the Week 6 slides?&rdquo;
            </h3>
            <ul className="mt-5 space-y-3">
              {[
                'Buried three years deep in a WhatsApp group',
                'Gone the moment someone leaves the class chat',
                'Invisible to every student who joins after you',
                'Impossible to search for anything specific',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]">
                  <span
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: 'var(--type-past-question)' }}
                    aria-hidden="true"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delayMs={120} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-[0_1px_2px_var(--shadow),0_20px_40px_-16px_var(--shadow)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">The CS Resource Hub way</p>
            <h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
              Search once. Find it every time.
            </h3>
            <ul className="mt-5 space-y-3">
              {[
                'Permanent home for every slide, note, and past question',
                'Organised by level, semester, and course — not by who happened to post it',
                'New students find last year’s materials on day one',
                'Structured search: course, type, year — filtered, not guessed',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-[var(--text-primary)]">
                  <span
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                    aria-hidden="true"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Resource types strip --------------------------------------------- */}
      <section className="px-4 sm:px-8 pb-4">
        <Reveal className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {TYPE_CHIPS.map(({ label, icon: Icon, token, soft }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold"
                style={{ color: `var(${token})`, backgroundColor: `var(${soft})` }}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Features ---------------------------------------------------------- */}
      <section className="px-4 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Why it works</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              A library, not a group chat.
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delayMs={i * 80}>
                <div className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_1px_2px_var(--shadow),0_1px_3px_var(--shadow)] transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_1px_2px_var(--shadow),0_20px_40px_-14px_var(--shadow)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-[var(--text-primary)]">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works -------------------------------------------------------- */}
      <section id="how-it-works" className="px-4 sm:px-8 py-16 sm:py-24 bg-[var(--surface-2)]">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">How it works</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Three taps to the file you need.
            </h2>
          </Reveal>

          <div className="mt-12 relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-[var(--border)]"
            />
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delayMs={i * 100} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-lg font-bold shadow-[0_1px_2px_var(--shadow),0_12px_24px_-8px_var(--shadow)]">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--text-primary)]">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Roles ------------------------------------------------------------- */}
      <section className="px-4 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Built for the whole department</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Everyone gets exactly the access they need.
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {ROLES.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delayMs={i * 100}>
                <div className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_2px_var(--shadow),0_1px_3px_var(--shadow)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-primary)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-[var(--text-primary)]">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA ----------------------------------------------------------- */}
      <section className="px-4 sm:px-8 pb-20 sm:pb-28">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 sm:px-16 sm:py-20 text-center shadow-[0_1px_2px_var(--shadow),0_32px_60px_-20px_var(--shadow)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 animate-gradient opacity-70"
              style={{
                backgroundImage:
                  'linear-gradient(120deg, color-mix(in srgb, var(--accent) 14%, transparent), color-mix(in srgb, var(--type-slides) 10%, transparent), color-mix(in srgb, var(--accent) 14%, transparent))',
              }}
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
                Stop scrolling WhatsApp for notes.
              </h2>
              <p className="mt-3 max-w-md mx-auto text-sm sm:text-base text-[var(--text-muted)]">
                Sign in with your email and find everything for your level in
                seconds.
              </p>
              <Link
                href="/sign-in"
                className="mt-8 inline-flex items-center gap-2 min-h-12 px-7 rounded-full text-sm font-semibold bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_1px_2px_var(--shadow),0_16px_32px_-12px_var(--shadow)] transition-transform hover:-translate-y-0.5"
              >
                Sign in with email
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer ------------------------------------------------------------ */}
      <footer className="px-4 sm:px-8 py-8 border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-subtle)]">
          <span>CS Resource Hub — KNUST Computer Science Department</span>
          <span>Levels 100–400 · Students, reps, and admins only</span>
        </div>
      </footer>
    </div>
  );
}
