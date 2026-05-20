# AI Todo Scheduler

A Google Keep-style task manager with AI-powered weekly scheduling. Organizes tasks into notes, reads your Google Calendar for free time, and uses Claude to generate a realistic weekly plan.

## Features

- **Dashboard** — Responsive grid of color-coded note cards with drag-and-drop reordering. Each note holds tasks with importance levels (LOW / MEDIUM / HIGH / CRITICAL), estimated durations, optional time windows (e.g. "only 08:00–20:00"), and repeat rules.
- **AI Weekly Plan** — Connects to Google Calendar, computes free slots around your existing events and sleep hours, then asks Claude to schedule your tasks by priority. Drag, resize, or delete scheduled events directly on the calendar.
- **Skipped tasks panel** — When there isn't enough time for everything, lower-priority tasks appear in a panel with AI suggestions for when to reschedule them.
- **Stale banner** — If you edit tasks after generating a plan, a banner prompts you to regenerate rather than silently overwriting your manual adjustments.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Server state | TanStack React Query 5 |
| UI state | Zustand 4 |
| Forms | React Hook Form 7 + Zod 3 |
| Drag & Drop | dnd-kit (dashboard), react-big-calendar DnD (calendar) |
| Calendar UI | react-big-calendar |
| Database | PostgreSQL 16 on Neon |
| ORM | Prisma 5 |
| Auth | Auth.js (NextAuth) 5 — Google OAuth |
| Google APIs | @googleapis/calendar |
| AI | Anthropic Claude (claude-sonnet-4-6) with prompt caching |
| Tests | Vitest 2 (unit) + Playwright (E2E) |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Ithomas13/Todo-list.git
cd Todo-list
pnpm install
```

### 2. Set up environment variables

Copy the example file and fill in each value:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection Details → Connection string |
| `NEXTAUTH_SECRET` | Run `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `ENCRYPTION_KEY` | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (must be 64 hex chars) |

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a project
2. Enable the **Google Calendar API**
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Set application type to **Web application**
5. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
6. Copy the Client ID and Secret into `.env.local`

### 4. Run the database migration

```bash
pnpm db:migrate
```

This creates all tables (User, Note, Task, ScheduledPlan, ScheduledSlot) in your Neon database.

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with Google and you're ready to go.

## Project Structure

```
src/
├── app/
│   ├── api/              # Route Handlers (notes, tasks, calendar, schedule, auth)
│   ├── dashboard/        # Note grid page
│   └── weekly-plan/      # Calendar page
├── components/
│   ├── dashboard/        # NoteGrid, NoteCard, NoteDialog, TaskForm, AddNoteButton
│   ├── weekly-plan/      # WeeklyPlanCalendar, SkippedTasksPanel, StaleBanner
│   └── layout/           # Sidebar, AuthButton
├── hooks/                # useNotes, useTasks, useSchedule
├── lib/
│   ├── auth/             # NextAuth config, token refresh
│   ├── calendar/         # Google Calendar client, free-slot computation
│   ├── scheduling/       # AI scheduler, prompt building, output schema
│   ├── crypto.ts         # AES-256-GCM token encryption
│   └── prisma.ts         # Prisma client singleton
├── store/                # Zustand UI store
└── types/                # Shared TypeScript types
prisma/
└── schema.prisma         # Database schema
```

## Running Tests

```bash
pnpm test          # Unit tests (watch mode)
pnpm test:run      # Unit tests (single run)
pnpm test:e2e      # Playwright E2E tests (requires dev server)
```

Unit tests cover the free-slot computation algorithm, AES-256-GCM crypto round-trips, and AI output schema validation.

## How the AI Scheduling Works

1. Fetches your Google Calendar events for the next 7 days
2. Adds sleep blocks (22:00–07:00) and merges all busy intervals
3. Extracts free gaps ≥ 15 minutes
4. Sends tasks + free slots to Claude with a system prompt instructing it to schedule CRITICAL → HIGH → MEDIUM → LOW, respect time windows, and never split tasks across slots
5. Validates the JSON response with Zod; retries once on parse failure
6. Saves the plan atomically — manually moved calendar events are preserved on regeneration
