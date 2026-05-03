# BeInShapeAnywhere — Project Context

A Next.js personal training platform where Jenny (trainer/admin) builds workout programs for clients. Clients log in via a per-program password and track their workouts in real-time. All data lives in Notion.

**Update this file whenever new features, DBs, or architectural changes are added.**

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16, App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4 — config via CSS `@theme {}`, no `tailwind.config.ts` |
| Database | Notion API (`@notionhq/client`) — Notion is the ONLY database |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` (used in admin builder) |
| Deployment | Netlify via `@netlify/plugin-nextjs` |

---

## Auth Model

- **Admin (Jenny):** POST to `/api/auth/admin` with `password`. Validates against `ADMIN_PASSWORD` env var. Stored in `sessionStorage` as `admin_token`.
- **Clients:** POST to `/api/auth/client` with `password`. The password is per-program (set when Jenny creates the program). On success, the full program object is stored in `sessionStorage` as `client_program`.
- **No cookies, no NextAuth.** Everything is session-based, appropriate for a private PT app.

---

## Notion Databases & Env Vars

| DB Name | Env Var | Purpose |
|---|---|---|
| Exercise Library | `NOTION_EXERCISE_DB` | All exercises with video URLs, muscle groups, equipment |
| Training Programs | `NOTION_PROGRAMS_DB` | Programs assigned to clients, password-protected |
| Workout Entries | `NOTION_ENTRIES_DB` | Exercises within a program (week, day, sets, reps, rest, superset group) |
| Workout Logs | `NOTION_LOGS_DB` | Logged completed workouts (created when client hits "Complete Workout") |

Other env vars: `NOTION_SECRET`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_NAME`

### Creating NOTION_LOGS_DB
Create a Notion database with these properties:
- **Name** (title) — auto-generated as "{Program Name} – {Date}"
- **Program** (relation → Training Programs DB)
- **Completed At** (date)
- **Duration (min)** (number)
- **Sets Completed** (number)
- **Total Sets** (number)
- **Notes** (rich text)
- **PRs** (rich text)

Then add the DB ID to Netlify env vars and `.env.local`.

---

## Directory Layout

```
src/
├── app/
│   ├── page.tsx                  ← login (admin + client)
│   ├── layout.tsx                ← root layout, PWA meta tags
│   ├── globals.css               ← CSS vars, utility classes (btn-primary, btn-secondary, input-field, spinner)
│   ├── admin/
│   │   ├── page.tsx              ← admin dashboard (program list, publish/unpublish)
│   │   └── builder/page.tsx      ← workout builder with dnd-kit drag-and-drop
│   ├── workout/
│   │   └── page.tsx              ← client workout viewer (set checkboxes, rest timer, complete button)
│   └── api/
│       ├── auth/admin/route.ts   ← verifies ADMIN_PASSWORD
│       ├── auth/client/route.ts  ← finds program by password
│       ├── clients/route.ts      ← client select options from Notion
│       ├── exercises/route.ts    ← exercise library CRUD
│       ├── exercises/seed/       ← one-time exercise seeder
│       ├── programs/route.ts     ← program list and creation
│       ├── programs/[id]/entries/route.ts       ← entry management
│       ├── programs/[id]/entries/move-day/      ← bulk move entries to different day
│       ├── programs/[id]/entries/update/        ← update/delete individual entry
│       ├── programs/[id]/publish/route.ts       ← publish/unpublish toggle
│       ├── workout-log/route.ts  ← POST to log completed workout to Notion
│       └── workout-history/route.ts ← GET logs for a program (for calendar)
├── components/
│   ├── WorkoutCalendar.tsx       ← 10-week heatmap calendar of completed workouts
│   └── admin/
│       ├── ExerciseLibrary.tsx   ← searchable exercise picker with category filter
│       ├── ProgramSettings.tsx   ← modal for program name/client/password/weeks
│       └── WeekDayGrid.tsx       ← 7-day sortable grid of workout entries
└── lib/
    ├── notion.ts                 ← ALL Notion API calls (singleton client + all DB functions)
    ├── types.ts                  ← builder-specific types (BuilderEntry, WeekPlan, SUPERSET_COLORS)
    └── useIsMobile.ts            ← mobile detection hook (breakpoint default 768px)
```

---

## Key Architectural Patterns

- **Notion is the only database.** No local DB, no ORM. `src/lib/notion.ts` is the data access layer.
- **All pages are Client Components** (`'use client'`) — this app was built with session-based auth that requires reading `sessionStorage`, which forces everything client-side. Future refactor could move data fetching to Server Components with cookie-based auth.
- **CSS variable system:** All colors live in `globals.css` as `var(--brand-*)`. Avoid hardcoding hex values in components.
- **Superset grouping:** Entries with the same `supersetGroup` letter (A–E) within the same day render as a visually grouped block with a colored left border.
- **Set tracking in workout page:** `setStates: Record<entryId, boolean[]>` tracks completion per set. `completedSets` and `totalSets` are derived from `todaysEntries` only (not all entries).

---

## Admin Workflows (How Things Currently Work)

### Adding a New Client
Clients are **not added through the app dashboard yet** — client names are stored as Select options on the **Client** property inside the Exercise Library database in Notion.

**Steps to add a new client:**
1. Open the [Exercise Library database](https://www.notion.so/41645763661a4ec48827b83e2be18a1c) in Notion
2. Open any exercise row
3. Find the **Client** property (Select type)
4. Click it → **Add option** → type the new client's name → confirm
5. The name will now appear in the Client dropdown when creating a new program in the admin builder

> **Future improvement:** Build an "Add Client" button directly in the admin dashboard that writes the new option to Notion via the API, so Jenny never has to touch Notion for client management.

### Creating a Program for a Client
1. Log into the admin dashboard at [beinshapeanywhere.netlify.app](https://beinshapeanywhere.netlify.app) with the admin password
2. Click **New Program**
3. Fill in: Program Name, Client (from dropdown), Total Weeks, Client Password (the code the client uses to log in), and an optional description
4. Use the builder to add exercises across days — drag to reorder, group into supersets (A–E), set reps/sets/rest
5. Click **Publish** when ready — the client can now log in with their password

### Client Login Flow
1. Client goes to [beinshapeanywhere.netlify.app](https://beinshapeanywhere.netlify.app)
2. Clicks **Client Login** and enters their program password
3. The app loads their program — they can navigate weeks and days, check off sets, use the rest timer, and hit **Complete Workout** to log the session to Notion

### Workout Logs Database
Completed workouts write to the **📋 Workout Logs** Notion database (ID: `4792359b37aa4ea0a72f5be93585392f`). Each log entry records: program name, date completed, duration, sets completed vs total, client notes, and any PRs flagged.

### Auto-syncing Exercise Videos from Giphy
The admin dashboard has a "Sync from Giphy" panel that pulls GIFs from Franklin's [DocGarrett channel](https://giphy.com/channel/DocGarrett) and writes them to the Video URL property of matching exercises in the Notion Exercise Library.

- **Fill blanks** — only updates exercises that don't already have a Video URL (safe default)
- **Overwrite all** — replaces every exercise's Video URL with a fresh Giphy match (use when re-curating)

Requires `GIPHY_API_KEY` env var (get one free at https://developers.giphy.com/dashboard).
The match uses `@docgarrett <exercise name>` Giphy search with `limit=5` and picks the best result. Implementation lives in `src/lib/giphy.ts` and `src/app/api/giphy/sync/route.ts`.

---

## How to Run Locally

```bash
npm run dev
```

Requires `.env.local` with all 6 vars (see `.env.example`). The `NOTION_LOGS_DB` var is optional — if missing, workout logging is skipped gracefully with a console warning.

---

## Deployment

- Repo: https://github.com/jajuangarrett-ctrl/BeInShapeAnywhere
- Auto-deploys to Netlify on push to `main`
- Build: `npm run build`, publish: `.next`
- Set all env vars in Netlify → Site Settings → Environment Variables
