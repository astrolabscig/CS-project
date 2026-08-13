// Computes a student's academic level from their 7-digit KNUST index number,
// per the department's entry-year + academic-calendar convention. Capped to
// this app's supported 100-400 range (see docs/CS-Resource-Hub-Design-v1.1.md
// §4 changelog v1.3) — results outside that range are surfaced for admin
// review rather than auto-applied.
export type KnustLevelResult =
  | { status: 'SUCCESS'; level: 100 | 200 | 300 | 400; entryYear: number; academicYear: number }
  | { status: 'FUTURE_ENTRY'; entryYear: number }
  | { status: 'BEYOND_SUPPORTED'; level: number; entryYear: number }
  | { status: 'INVALID_FORMAT' };

const DEFAULT_ACADEMIC_YEAR_START_MONTH = 10; // October

function academicYearStartMonth(): number {
  const raw = Number(process.env.ACADEMIC_YEAR_START_MONTH);
  return Number.isInteger(raw) && raw >= 1 && raw <= 12 ? raw : DEFAULT_ACADEMIC_YEAR_START_MONTH;
}

// "YYYY/YYYY" label for the academic year `now` falls in, using the same
// October-rollover convention as computeKnustLevel. Used to stamp a sensible
// default academicYear on resources that don't have one supplied by the
// uploader (e.g. an AI-extracted timetable file).
export function currentAcademicYearLabel(now: Date = new Date()): string {
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startYear = currentMonth < academicYearStartMonth() ? currentYear - 1 : currentYear;
  return `${startYear}/${startYear + 1}`;
}

export function computeKnustLevel(indexNumber: string, now: Date = new Date()): KnustLevelResult {
  const trimmed = indexNumber.trim();
  if (!/^\d{7}$/.test(trimmed)) return { status: 'INVALID_FORMAT' };

  // Last two digits encode the entry year (e.g. "24" -> 2024).
  const entryYear = 2000 + Number(trimmed.slice(-2));

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const academicYear = currentMonth < academicYearStartMonth() ? currentYear - 1 : currentYear;

  const level = (academicYear - entryYear + 1) * 100;

  if (level < 100) return { status: 'FUTURE_ENTRY', entryYear };
  if (level > 400) return { status: 'BEYOND_SUPPORTED', level, entryYear };
  return { status: 'SUCCESS', level: level as 100 | 200 | 300 | 400, entryYear, academicYear };
}
