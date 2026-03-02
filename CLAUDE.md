# HIIT Timer v2 — Project Context for AI Agents

## Stack
- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime)
- **Auth:** Supabase Auth — email/password, magic link, OAuth (Google, Apple)
- **Package manager:** npm

## Project Structure

```
app/                    # Next.js App Router pages
  page.tsx              # Home — workout selection + custom builder (783 LOC)
  timer/page.tsx        # Timer execution
  discover/page.tsx     # Community workout discovery
  user/[username]/      # Public user profiles
  auth/callback/        # OAuth redirect handler
  auth/auth-code-error/ # OAuth error fallback
components/             # React components
  AuthProvider.tsx      # Auth context + session management
  AuthModal.tsx         # Sign-in/up/magic-link modal
  AuthGate.tsx          # Auth state wrapper
  ThemeProvider.tsx     # Dark/light theme context
  SaveWorkoutModal.tsx  # Save workout dialog
  ProfileSetupModal.tsx # Profile create/edit dialog
  PresetCard.tsx        # Workout card display
  Controls.tsx          # Timer play/pause/reset buttons
  TimerDisplay.tsx      # Countdown display + current phase
  ProgressRing.tsx      # SVG circular progress indicator
hooks/
  useTimer.ts           # Core timer state machine (idle→work→rest→complete)
  useAudio.ts           # Web Audio API procedural tones
lib/
  supabase.ts           # Supabase client init + helpers
  database.types.ts     # TypeScript interfaces for all DB tables
  presets.ts            # Built-in workout presets + WorkoutConfig helpers
  history.ts            # Workout history (localStorage + DB sync)
  savedWorkouts.ts      # Saved/community workout CRUD + search/filter
  profiles.ts           # User profile CRUD + social follow
supabase/
  schema.sql            # Database schema, indexes, RLS policies
public/                 # Static assets, PWA manifest + icons
```

## Agent Responsibility Matrix

Each agent owns specific files. Changes to files owned by another agent should be flagged.

| Agent | Owns | Description |
|-------|------|-------------|
| **frontend** | `app/*.tsx`, `components/` (non-auth), `tailwind.config.ts`, `app/globals.css`, `public/` | UI, pages, styling |
| **data** | `lib/history.ts`, `lib/savedWorkouts.ts`, `lib/profiles.ts`, `lib/presets.ts`, `hooks/useTimer.ts`, `hooks/useAudio.ts` | Data layer, hooks, business logic |
| **database** | `supabase/schema.sql`, `lib/database.types.ts`, `lib/supabase.ts` | Schema, types, DB client |
| **auth** | `components/AuthProvider.tsx`, `components/AuthModal.tsx`, `components/AuthGate.tsx`, `app/auth/` | Auth, sessions, OAuth |
| **qa** | All files (read-only review) | Validates changes across all domains |

## Coding Conventions

- **TypeScript strict mode** — no `any`, no implicit returns
- **Tailwind only** — no inline styles or separate CSS files (except globals.css)
- **Supabase client** — always import from `lib/supabase.ts`, never instantiate directly
- **Error handling** — return `{ data, error }` objects from lib functions (Supabase pattern)
- **Component size** — prefer composing smaller components; if a component exceeds ~200 LOC, split it
- **No console.log** in production code; use structured error returns
- **Auth checks** — always use the `useAuth()` hook from `AuthProvider.tsx`; never read Supabase session directly in components

## Key Data Types

```typescript
// WorkoutConfig — the runtime workout structure passed to useTimer
type WorkoutConfig = {
  mode: 'simple' | 'circuit'
  workSeconds: number
  restSeconds: number
  rounds: number
  exercises?: string[]          // circuit mode: exercise names per slot
  roundRestSeconds?: number     // rest between circuit rounds
}

// SavedWorkout — stored in Supabase saved_workouts table
// WorkoutHistory — stored in Supabase workout_history table
// Profile — stored in Supabase profiles table
// All types defined in lib/database.types.ts
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Set in `.env.local`. Never hardcode these.

## Running the Project

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build (validates TypeScript)
npm run lint       # ESLint check
npx tsc --noEmit   # TypeScript type check only (no emit)
```

## Swarm Development Workflow

See `.claude/WORKFLOW.md` for how the PM → Specialist → QA → Implement pipeline works.
