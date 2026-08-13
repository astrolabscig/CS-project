# UI Specification

**Read this before any frontend work.** This is the FINAL visual direction — derived from direct observation of app.studystream.live. Rules are imperative — follow them literally. Behaviour and data model live in `CS-Resource-Hub-Design-v1.1.md`; this file governs look, feel, and frontend conventions.

The visual language: a **calm, focused, dark-first study tool** — near-black canvas, a slim left icon-rail, generously rounded cards with soft borders and subtle depth, a single bright violet/indigo accent, clean sans type. It is a course-materials **library**, not a social feed — the reference's community/feed/streak/video content is explicitly **not** part of this app; only its palette, card language, and navigation shell are adopted.

---

## Non-negotiables (read first)

1. **Never hardcode a colour.** No hex, `rgb()`, or named colours in components or class strings. Use semantic tokens only (see Tokens). If a colour you need has no token, add it to **both** themes in the theme file and ask the human for values — do **not** invent one.
2. **Dark is the default theme.** Light mode still exists and must work, but the primary experience — and what gets designed/tested first — is dark. This is a reversal from earlier drafts of this spec; do not default to light.
3. **This is a library, not a social app.** Take the reference's shell, card, and nav *styling* only. Do **not** build a feed, posts, streaks, likes, avatars-of-other-users, or community content. Content stays: Level → Semester → Course → Resources, plus the existing rep/admin tools.
4. **Icon-rail navigation.** A slim, icon-only left rail (like the reference) replaces/streamlines the previous full-width sidebar for primary navigation, with labels visible on hover/expand or in a secondary panel — not a dense always-expanded text sidebar.
5. **Rounded, soft-bordered cards with real depth.** Generous corner radius, a soft 1px border plus subtle shadow/glow — cards should feel like distinct floating panels on the dark canvas, not flat rectangles.
6. **One accent, used with intent.** A bright violet/indigo accent (see Tokens) marks the active nav item, primary buttons, progress indicators, and key highlights — never as a full-surface wash.
7. **Mobile-first and accessible.** Design for a narrow screen first; meet the accessibility checklist every time.
8. **Stay in scope.** Build only the assigned task. Do not scaffold auth, backend, or other pages unless told to.

---

## Stack & structure
- Next.js **App Router** + **TypeScript** (strict) + **Tailwind CSS**.
- Server Components by default; add `"use client"` only when interactivity requires it.
- Structure: pages/layouts in `app/`, reusable UI in `components/`, helpers in `lib/`, shared types in `types/`.
- One component per file, PascalCase. Keep components small and presentational; lift data fetching to the page/server layer.
- No new dependencies without flagging why.

## Theming & tokens
All colours, radii, shadows, and spacing come from tokens in **one** place (`globals.css`). Components reference tokens via Tailwind theme classes or `var(--token)`. **Token names are fixed; values are the human's to set** — the values below are the locked direction; do not substitute different colours.

**Theme switching:** dark is `:root` (default); light values live under `[data-theme="light"]`. Persist the user's choice; on first visit default to dark rather than `prefers-color-scheme` (this app's default identity is dark).

Semantic tokens (dark value → light value):
- Surfaces: `--bg` (near-black canvas, e.g. `#0c0e13` → light `#f4f5f7`) · `--surface` (card background, e.g. `#151822` → `#ffffff`) · `--surface-2` (rail/nested panels, e.g. `#10121a` → `#f0f1f4`) · `--surface-hover` (subtle lighten on hover)
- Rail/top bar: `--rail-bg` · `--topbar-bg` (dark, near `--bg`, not a separate light bar) · `--topbar-fg`
- Text: `--text-primary` (near-white, e.g. `#f3f4f7` → near-black) · `--text-muted` · `--text-subtle`
- Lines & depth: `--border` (soft, low-contrast — e.g. `rgba(255,255,255,0.08)` in dark) · `--focus` · `--shadow` (soft, slightly glowing in dark mode) · `--scrim`
- Accent: `--accent` (bright violet/indigo, e.g. `#7c6cf6`) · `--accent-fg` (near-white text on accent, since this accent is saturated/dark enough to take light text — unlike the earlier pastel) · `--accent-subtle` (low-opacity accent tint for active-state backgrounds)

> Exact hex values above are a starting point matching the observed reference; fine-tune for contrast/accessibility, but stay in this violet/indigo family — do not revert to periwinkle or any prior palette.

## Layout (from the reference)
- **Left icon rail:** slim (about 56–64px), fixed, full viewport height, dark (`--rail-bg`), icon-only nav (Home/Browse, Search, Uploads [rep], Admin [admin]) with the active item marked by an `--accent` highlight (filled icon, accent background pill, or left accent bar). A small brand mark sits at the top of the rail.
- **Top strip:** minimal — page title/breadcrumb + search entry point + account avatar + theme toggle. Not a heavy bar; keep it low-height and consistent with the rail's dark tone (no separate light top bar).
- **Content canvas:** `--bg`, holding rounded `--surface` cards. Comfortable padding, cards read as distinct floating panels via border + soft shadow.
- **Mobile:** rail collapses to a bottom icon bar or an off-canvas drawer (reuse existing responsive patterns) — same icon set, same active-state treatment.

## Aesthetic rules
- **Depth via border + soft shadow**, not flat rectangles — every card should read as slightly lifted off the canvas, more so than prior "light/airy" drafts of this spec.
- **Generous corner radius** (~16–20px on cards, ~10–12px on buttons/inputs, pill-shaped on badges/tags).
- **Confident but quiet type** — clear hierarchy from weight + `--text-primary`/`--text-muted`, not oversized headlines.
- **Accent discipline** — violet/indigo only on: active rail icon, primary buttons, progress/status accents, key pills (e.g. "N resources"). Always sufficient contrast for its foreground text.
- **No decorative gradients, no marketing hero art, no feed-style content cards** (avatars posting updates, streak counters, "unlock more" paywalls) — those are the reference's product, not this app's.

## Typography
- Neutral sans for UI/body (keep Geist / Geist Mono as already set up, unless replaced later). Clear hierarchy via size + weight; muted greys for meta.
- Tabular numbers for sizes, counts, dates.
- Course codes (e.g. `CSM 158`) render in a small **monospace** chip — keep this signature detail, restyled to the new dark/rounded card language (dark chip background, light border-tint text).

## Component conventions
Build as reusable components; each handles its states, both themes, and keyboard access.
- **Rail** — icon-only vertical nav, fixed, full height, dark; active item gets an `--accent` treatment; tooltip or expand-on-hover for labels.
- **TopStrip** — minimal: title/breadcrumb, search trigger (icon → expands, don't dock a full-width bar), account, theme toggle.
- **CourseCard** — rounded `--surface` card, soft border + shadow: mono code chip, bold title, muted lecturer, `--accent`-treated "N resources" pill.
- **ResourceRow** — compact row in a rounded container: type badge, title, muted year, tabular file size, `--accent` Download/Open action.
- **Pill / Badge** — small, fully rounded; accent for emphasized states, neutral `--surface-2` otherwise.
- **Button** — primary = `--accent` bg + `--accent-fg`; secondary = `--surface` with `--border`.
- **Drawer / Modal** — upload & dialogs on `--surface`, rounded, soft shadow; focus-trapped, `Esc` closes, `aria`-labelled.
- **EmptyState** — centred rounded card, one line of `--text-muted`.

## Navigation & routes
- Flow: Level → Semester → Course → Resources, plus global search. Never a feed, board, or dashboard.
- Routes follow the page inventory: `/login`, onboarding, `/` (browse), `/courses/[code]`, `/search`, `/profile`, rep uploads, `/admin/*`.
- Reps and admins get **extra controls on shared pages** (rendered by role), not duplicate pages or a separate app shell.

## Accessibility checklist (every task)
- Semantic HTML (`nav`, `main`, `button`, `ul/li`); never a `div` for interactive elements.
- Visible keyboard focus using `--focus`; full keyboard operability; icon-only rail items have accessible labels (`aria-label`), not just tooltips.
- Sufficient text contrast in **both** themes — dark mode's low-contrast borders (`--border`) are fine for dividers but text must stay high-contrast against `--bg`/`--surface`.
- All images have `alt`; meaningful icons have accessible labels.
- Comfortable tap targets on mobile (~44px).
- Drawers/modals: focus trap, `Esc` to close, restore focus on close.
- Theme toggle is a labelled control; state exposed to assistive tech.

## Responsive
- Mobile-first: rail becomes a bottom bar or off-canvas drawer; content single-column; no horizontal scroll.
- Enhance to rail + multi-column card grids at larger breakpoints. Test the narrow view first.

## Data & state
- Use mock/real data via existing providers/API as already wired — never invent a backend or call APIs not in the spec.
- Always render **loading, empty, and error** states, not just the happy path.
- Show file size next to every download.

## Anti-patterns — never do these
- ❌ Hardcoded colours anywhere. ❌ Feed/posts/streaks/community/video content. ❌ Reverting to periwinkle, the prior light-airy palette, or any earlier direction. ❌ A full-width always-expanded text sidebar (use the icon rail). ❌ Flat cards with no border/shadow depth. ❌ Defaulting to light theme. ❌ Committing `.env`. ❌ Building beyond the assigned task.

## Definition of done (self-check before finishing)
- [ ] No hardcoded colours; only semantic tokens; both dark and light values set for any new token.
- [ ] Dark mode is the default and looks fully intentional (not just an inverted light theme).
- [ ] Icon rail nav present, active state uses the accent correctly.
- [ ] Cards read as soft-bordered, shadowed, rounded panels — real depth.
- [ ] Library content only — no feed/social/streak elements anywhere.
- [ ] Mobile-first; accessibility checklist met.
- [ ] Loading/empty/error states handled.
- [ ] Only the assigned task was built; `npm run build` passes.