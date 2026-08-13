import { z } from 'zod';

// AI timetable extraction (design doc: ClassSession suggest -> review ->
// publish workflow). Server-only — sends the uploaded LEVEL timetable
// image/PDF to Gemini's vision API and asks for strict JSON: one multi-row
// table covering every course at that level for the period (a KNUST exam
// timetable, not a single course's weekly schedule). Output is never
// trusted blindly: it's Zod-validated here, and every row lands as DRAFT —
// nothing this module returns is shown to students until a rep/admin
// publishes it.

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const FETCH_TIMEOUT_MS = 20000;
const MAX_ROWS = 200; // a whole level's exam timetable can list many courses/dates

export class GeminiApiError extends Error {}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const extractedRowSchema = z.object({
  date: z.string().regex(DATE_PATTERN, 'Expected YYYY-MM-DD'),
  courseCode: z.string().trim().min(1).max(30),
  courseTitle: z.string().trim().min(1).max(180),
  startTime: z.string().regex(TIME_PATTERN, 'Expected 24h HH:MM'),
  endTime: z.string().regex(TIME_PATTERN, 'Expected 24h HH:MM'),
  venue: z.string().trim().max(80).nullable().optional(),
});

const extractedTimetableSchema = z.array(extractedRowSchema).max(MAX_ROWS);

export type ExtractedTimetableRow = z.infer<typeof extractedRowSchema>;

function buildPrompt(levelScope: number, academicPeriod: string): string {
  return `You are reading a university timetable (e.g. an exam or class timetable) from an uploaded image or PDF, for Level ${levelScope}, ${academicPeriod}.

This is a multi-row table listing MANY different courses, each with its own date, time, and venue — not a single course's weekly schedule. Extract every row you can confidently read.

Return a JSON array where each item has exactly these keys:
- "date": the calendar date printed for that row, as "YYYY-MM-DD" (infer the year from the academic period given above if the table only prints day/month)
- "courseCode": the course code as printed (e.g. "CSM 251")
- "courseTitle": the course title as printed
- "startTime": 24-hour "HH:MM"
- "endTime": 24-hour "HH:MM"
- "venue": the room/venue as printed, or null if not shown

If the image is too unclear to read confidently, or you cannot find a real timetable table in it, return an empty array []. Do not guess dates, times, or venues you can't actually read — skip a row rather than invent it. Return ONLY the JSON array — no commentary, no markdown formatting.`;
}

function stripJsonFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

/**
 * Sends a level timetable file to Gemini's vision API and returns every row
 * it found. Returns an empty array (not an error) when Gemini legitimately
 * finds nothing — the caller decides how to message that.
 */
export async function extractTimetableFromFile(
  fileBytes: Uint8Array,
  mimeType: string,
  levelScope: number,
  academicPeriod: string
): Promise<ExtractedTimetableRow[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiApiError('AI timetable extraction is not configured.');

  const base64 = Buffer.from(fileBytes).toString('base64');
  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildPrompt(levelScope, academicPeriod) },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new GeminiApiError('Could not reach the timetable reader right now.');
  }

  if (!response.ok) {
    if (response.status === 429) throw new GeminiApiError('Timetable reader quota reached — try again later.');
    throw new GeminiApiError(`Timetable reader request failed (${response.status}).`);
  }

  const body = await response.json().catch(() => null);
  const text: unknown = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new GeminiApiError("Couldn't read this timetable — try a clearer photo or enter manually.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFences(text));
  } catch {
    throw new GeminiApiError("Couldn't read this timetable — try a clearer photo or enter manually.");
  }

  const parsed = extractedTimetableSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new GeminiApiError("Couldn't read this timetable — try a clearer photo or enter manually.");
  }

  return parsed.data;
}
