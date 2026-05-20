# Agent Implementation Context — AI-Scheduled Todo App

This document contains everything needed to implement this app from scratch. The architecture, tech stack, and all major decisions have been approved by the user. Follow this spec exactly.

---

## Working Directory

`C:\Users\Isaiah\Documents\GitHub\Todo-list`

The repo is a clean greenfield project with only a README and .gitattributes. Build everything here.

---

## Developer Preferences (MUST follow)

- **TDD**: Write tests before implementation code for every feature. Verify tests pass before moving to the next step. Never skip ahead when tests are failing.
- **Commits**: Commit regularly with clear, imperative-mood messages (e.g., "Add Prisma schema and initial migration"). Do NOT add `Co-Authored-By` lines — commits must be under `Isaiah Thomas` only.
- **GitHub pushes**: Push after each significant completed milestone (e.g., auth works, CRUD API works, AI scheduling works). Push messages should be descriptive.
- **Subagents**: Spawn subagents for running and evaluating tests when appropriate.
- **Auto-accept edits**: Do not prompt for confirmation on file edits.
- **No unnecessary comments**: Default to no comments in code. Only add one if the WHY is non-obvious.
- **No Co-Authored-By trailers** in any commit.

---

## App Overview

A Google Keep–style task manager with AI-powered weekly scheduling.

**Page 1: Dashboard**
- Responsive grid of card-style notes (like Google Keep)
- Each note: title, text description, list of tasks
- Each task: name, importance level (LOW/MEDIUM/HIGH/CRITICAL), expected duration (minutes), optional time windows (e.g. "only 08:00–20:00"), optional repeat (NONE/DAILY/WEEKLY)
- Add and delete notes; add, edit, and delete tasks within a note
- Cards can be reordered by drag-and-drop

**Page 2: Weekly Plan**
- Reads user's Google Calendar for the next 7 days
- AI (Claude) finds free time slots and generates a weekly schedule
- Prioritizes CRITICAL → HIGH → MEDIUM → LOW tasks
- Respects task time windows (e.g. dog walk only during daylight)
- If insufficient time, omits lowest-priority tasks and shows them in a "Skipped" panel with AI suggestions
- User can drag/resize/delete tasks on the calendar view; changes persist to DB
- Auto-refreshes when tasks change; shows "Tasks changed — regenerate?" banner when plan is stale
- No auto-regeneration (would discard user's manual edits)

**Sidebar navigation** between the two pages.

---

## Tech Stack

| Layer | Package | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Single monorepo, RSC, built-in Route Handlers |
| Language | TypeScript 5.x strict | Everywhere — frontend + backend |
| Styling | Tailwind CSS 3.x | Utility-first |
| Components | shadcn/ui | Radix-based, copy-paste, `npx shadcn-ui@latest add` |
| Server state | @tanstack/react-query 5.x | Caching, cross-page invalidation |
| UI state | zustand 4.x | Modal state, drag state |
| Forms | react-hook-form 7.x + zod 3.x | Shared Zod schemas frontend/backend |
| Drag & Drop | @dnd-kit/core @dnd-kit/sortable | Card reorder on dashboard |
| Calendar UI | react-big-calendar 1.x | Week view + DragAndDrop addon |
| Dates | date-fns 3.x | react-big-calendar localizer |
| Database | PostgreSQL 16 on Neon | Serverless-friendly, free tier |
| ORM | Prisma 5.x | Type-safe, migrations |
| Auth | Auth.js (NextAuth) 5.x | Google OAuth, offline access |
| Google APIs | @googleapis/calendar 8.x | Server-side only |
| AI | @anthropic-ai/sdk (latest) | Claude for scheduling, use prompt caching |
| Pkg manager | pnpm 9.x | Faster than npm |
| Unit tests | vitest 2.x | |
| E2E tests | Playwright 1.x | |

---

## Database Schema

File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                 String          @id @default(cuid())
  email              String          @unique
  name               String?
  image              String?
  googleAccessToken  String?
  googleRefreshToken String?
  googleTokenExpiry  DateTime?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
  notes              Note[]
  scheduledPlans     ScheduledPlan[]
  accounts           Account[]
  sessions           Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Note {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String?
  color       String?
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tasks       Task[]
  @@index([userId, position])
}

model Task {
  id             String          @id @default(cuid())
  noteId         String
  note           Note            @relation(fields: [noteId], references: [id], onDelete: Cascade)
  name           String
  importance     ImportanceLevel
  durationMins   Int
  timeWindows    Json?
  repeatRule     RepeatRule      @default(NONE)
  completed      Boolean         @default(false)
  position       Int             @default(0)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  scheduledSlots ScheduledSlot[]
  @@index([noteId])
}

enum ImportanceLevel { LOW MEDIUM HIGH CRITICAL }
enum RepeatRule      { NONE DAILY WEEKLY }

model ScheduledPlan {
  id          String          @id @default(cuid())
  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  weekStart   DateTime
  generatedAt DateTime        @default(now())
  slots       ScheduledSlot[]
  @@unique([userId, weekStart])
  @@index([userId, weekStart])
}

model ScheduledSlot {
  id            String        @id @default(cuid())
  planId        String
  plan          ScheduledPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  taskId        String
  task          Task          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  startTime     DateTime
  endTime       DateTime
  manuallyMoved Boolean       @default(false)
  skipped       Boolean       @default(false)
  skipReason    String?
  @@index([planId])
  @@index([taskId])
}
```

**Key design notes:**
- `timeWindows` is JSON: `[{ start: "08:00", end: "20:00", label: "daylight" }]`
- `ScheduledPlan` unique on `(userId, weekStart)` — regenerating replaces the existing plan
- `manuallyMoved: true` signals the scheduler to preserve a user-placed slot on regeneration
- Google tokens on `User` model are encrypted with AES-256-GCM (`src/lib/crypto.ts`)

---

## API Routes

All under `src/app/api/`:

```
POST   /api/auth/[...nextauth]          NextAuth Google OAuth

GET    /api/notes                       List notes for current user
POST   /api/notes                       Create note
PATCH  /api/notes/[id]                  Update note
DELETE /api/notes/[id]                  Delete note (cascades tasks)

GET    /api/notes/[id]/tasks            List tasks for note
POST   /api/notes/[id]/tasks            Create task
PATCH  /api/tasks/[id]                  Update task
DELETE /api/tasks/[id]                  Delete task

GET    /api/calendar/events             Fetch GCal events + computed free slots for next 7 days

POST   /api/schedule/generate           Trigger AI scheduling { weekStart: ISO string }
GET    /api/schedule                    Get plan for week (?weekStart=ISO)
PATCH  /api/schedule/slots/[id]         User moved/resized slot { startTime, endTime, manuallyMoved: true }
DELETE /api/schedule/slots/[id]         User removed slot from calendar
```

---

## AI Scheduling Pipeline

`src/lib/scheduling/scheduler.ts` — called from `POST /api/schedule/generate`

### Step 1: Compute free slots (pure TypeScript, no AI)
1. Fetch Google Calendar events via `src/lib/calendar/fetchEvents.ts`
2. Add sleep blocks: 22:00–07:00 each day
3. Merge overlapping blocked intervals, extract gaps
4. Filter gaps < 15 minutes

### Step 2: Call Claude with prompt caching
```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  system: [
    { type: "text", text: SCHEDULING_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    { type: "text", text: JSON.stringify(tasks), cache_control: { type: "ephemeral" } }
  ],
  messages: [{ role: "user", content: JSON.stringify(freeSlots) }]
})
```

System prompt rules: schedule CRITICAL first, then HIGH → MEDIUM → LOW. Respect `timeWindows`. No splitting tasks across slots. Output JSON only.

Expected AI output schema (validate with Zod):
```typescript
interface AIOutput {
  scheduled: Array<{ taskId: string; slotStart: string; slotEnd: string }>
  skipped: Array<{ taskId: string; reason: string; suggestion: string }>
}
```

### Step 3: Validate + persist
- Zod-validate AI output; retry once on failure
- Upsert `ScheduledPlan` + bulk-create `ScheduledSlot` rows in a Prisma transaction

---

## Google Calendar OAuth

`src/app/api/auth/[...nextauth]/route.ts`:
- Google provider with scopes: `openid email profile https://www.googleapis.com/auth/calendar.readonly`
- `access_type: "offline"`, `prompt: "consent"` (always get refresh token)
- JWT callback stores `accessToken`, `refreshToken`, `expiresAt`
- `src/lib/auth/refreshToken.ts` handles token refresh on expiry
- Tokens stored encrypted on `User` row for server-side scheduling use

---

## Sync Strategy

- Task mutations → `queryClient.invalidateQueries(['notes'])` + `queryClient.invalidateQueries(['schedule'])`
- `QueryClient` is a module-level singleton (works cross-page)
- Weekly Plan query: `staleTime: 0, refetchOnWindowFocus: true`
- No auto-regeneration — show `"Tasks changed — regenerate?"` banner when `max(task.updatedAt) > plan.generatedAt`

---

## Component Map

### Dashboard (`src/components/dashboard/`)
- `NoteGrid` — dnd-kit SortableContext, responsive grid
- `NoteCard` — colored card, title, description, truncated task list, opens NoteDialog
- `NoteDialog` — shadcn Dialog, full CRUD for note + tasks
- `TaskForm` — react-hook-form: name, importance Select, duration (preset buttons), timeWindows (time range picker), repeat Select
- `AddNoteButton` — floating action button

### Weekly Plan (`src/components/weekly-plan/`)
- `WeeklyPlanCalendar` — react-big-calendar + DragAndDrop addon; onEventDrop/Resize → PATCH slot
- `ScheduledEvent` — custom event: task name, importance badge, delete button
- `SkippedTasksPanel` — collapsible list of unscheduled tasks + suggestions
- `RegenerateButton` — triggers POST /api/schedule/generate, shows spinner
- `StaleBanner` — "Tasks changed — regenerate?" shown when plan is stale

### Layout (`src/components/layout/`)
- `Sidebar` — navigation between Dashboard and Weekly Plan
- `AuthButton` — sign in / sign out

---

## Directory Structure

```
C:\Users\Isaiah\Documents\GitHub\Todo-list\
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root: SessionProvider, QueryClientProvider
│   │   ├── page.tsx                  # Redirect → /dashboard
│   │   ├── globals.css
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── weekly-plan/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── notes/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── tasks/route.ts
│   │       ├── tasks/[id]/route.ts
│   │       ├── calendar/events/route.ts
│   │       └── schedule/
│   │           ├── route.ts
│   │           ├── generate/route.ts
│   │           └── slots/[id]/route.ts
│   ├── components/
│   │   ├── dashboard/
│   │   ├── weekly-plan/
│   │   ├── layout/
│   │   └── ui/               # shadcn/ui components
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth/
│   │   │   ├── config.ts
│   │   │   └── refreshToken.ts
│   │   ├── calendar/
│   │   │   ├── client.ts
│   │   │   ├── fetchEvents.ts
│   │   │   └── computeFreeSlots.ts
│   │   ├── scheduling/
│   │   │   ├── buildContext.ts
│   │   │   ├── callAI.ts
│   │   │   ├── scheduler.ts
│   │   │   └── schemas.ts
│   │   ├── crypto.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useNotes.ts
│   │   ├── useTasks.ts
│   │   └── useSchedule.ts
│   ├── store/
│   │   └── ui.ts
│   └── types/
│       ├── index.ts
│       ├── api.ts
│       └── calendar.ts
├── tests/                    # Playwright E2E
├── .env.local                # Never committed
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## Environment Variables

`.env.example`:
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ANTHROPIC_API_KEY=
ENCRYPTION_KEY=    # 32-byte hex: openssl rand -hex 32
```

---

## Build Sequence (follow in order — TDD at each step)

1. **Bootstrap** — `pnpm create next-app@latest` (TypeScript + Tailwind + App Router + src/ dir). Set up eslint, prettier, vitest, Playwright.
2. **Database** — Write Prisma schema, `prisma migrate dev`, generate client. Test: verify all tables exist with correct columns.
3. **Auth** — NextAuth + Google provider, token storage + AES encryption. Test: sign-in flow, token refresh, encrypted token round-trip.
4. **Notes/Tasks CRUD API** — Route Handlers for notes and tasks. Test: unit + integration tests for all endpoints against test DB.
5. **Dashboard UI** — NoteGrid, NoteCard, NoteDialog, TaskForm, AddNoteButton. Test: create/edit/delete note and tasks in browser.
6. **Google Calendar integration** — `computeFreeSlots`, `GET /api/calendar/events`. Test: free-slot algorithm with fixture data (overlapping events, midnight-spanning, all-day).
7. **AI Scheduling** — `buildContext`, `callAI`, `POST /api/schedule/generate`. Test: mock Anthropic SDK + GCal client; verify correct ScheduledSlot rows created.
8. **Calendar UI** — WeeklyPlanCalendar, drag/resize → PATCH slot, SkippedTasksPanel, StaleBanner. Test: E2E drag event → verify DB updated.
9. **Sync** — Cross-page invalidation, stale banner logic. Test: edit task on dashboard → navigate to weekly plan → verify banner.
10. **Polish** — Loading skeletons, error boundaries, mobile responsiveness.

---

## Testing Strategy

**Unit tests (vitest):**
- `src/lib/calendar/computeFreeSlots.test.ts` — Overlapping events, midnight-crossing, all-day events, empty weeks
- `src/lib/scheduling/schemas.test.ts` — Zod validation of AI output, malformed JSON handling
- `src/lib/crypto.test.ts` — AES-256-GCM encrypt/decrypt round-trip

**Integration tests (vitest + test Postgres DB):**
- Route Handlers for notes/tasks CRUD
- Schedule generation with mocked Anthropic + GCal

**E2E (Playwright):**
- Full Google sign-in
- Create note → tasks → generate schedule → verify task placement respects time windows
- Drag calendar event → refresh → position persisted
- Delete task → stale banner appears on weekly plan

---

## Critical Implementation Notes

1. `computeFreeSlots.ts` is the most bug-prone file — test it thoroughly before connecting the AI step.
2. The `prompt: "consent"` + `access_type: "offline"` in the Google provider is required to receive a refresh token every sign-in.
3. Use Prisma transactions for schedule generation: upsert plan + create all slots atomically.
4. `manuallyMoved: true` slots must be preserved on re-generation — the scheduler must skip re-placing them.
5. The `QueryClient` must be initialized as a module-level singleton (not inside a component) for cross-page `invalidateQueries` to work.
6. Token encryption key must be exactly 32 bytes (64 hex chars). Generate with `openssl rand -hex 32`.
