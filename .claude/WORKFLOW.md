# Swarm Development Workflow

This project uses a multi-agent development pipeline. Here's how it works.

## The Agents

| Agent | Prompt file | Owns |
|-------|-------------|------|
| **PM** | `.claude/agents/pm.md` | Routing, task specs |
| **Frontend** | `.claude/agents/frontend.md` | UI, pages, styling |
| **Data** | `.claude/agents/data.md` | Data layer, hooks, business logic |
| **Database** | `.claude/agents/database.md` | Schema, types, Supabase client |
| **Auth** | `.claude/agents/auth.md` | Auth, sessions, OAuth |
| **QA** | `.claude/agents/qa.md` | Review + validation gate |

---

## Pipeline for Every Request

```
User Request
    │
    ▼
[PM Agent]
  - Reads CLAUDE.md for file ownership
  - Produces structured Task Spec(s)
  - Flags ambiguities for user to resolve
    │
    ▼
[Specialist Agent(s)] — runs in git worktree for isolation
  - Frontend / Data / Database / Auth
  - Makes the change
  - Produces Change Summary
    │
    ▼
[QA Agent]
  - Reviews the diff
  - Runs: npx tsc --noEmit
  - Checks against QA checklist
  - Returns: APPROVED or CHANGES REQUESTED
    │
    ├── CHANGES REQUESTED → back to Specialist
    │
    └── APPROVED
            │
            ▼
        Implement (merge branch / apply changes)
```

---

## How to Invoke This Pipeline

### Step 1 — Describe your request to the main Claude session

Just describe what you want in plain English. For example:
> "Add a 'difficulty' field to saved workouts that users can set when saving"

### Step 2 — Spawn the PM agent

Claude (the main session) will read your request and spawn a PM agent like this:

```
Agent tool call:
  subagent_type: general-purpose
  prompt: [contents of .claude/agents/pm.md] + "\n\n## User Request\n[your request here]"
```

The PM returns a Task Spec.

### Step 3 — Spawn the specialist agent(s) in a worktree

For each task in the PM's spec, Claude spawns the right specialist agent with isolation:

```
Agent tool call:
  subagent_type: general-purpose
  isolation: worktree
  prompt: [contents of .claude/agents/[domain].md] + "\n\n## Task Spec\n[PM's task spec]"
```

The specialist makes the changes in an isolated branch and returns a Change Summary + diff.

### Step 4 — Spawn the QA agent

```
Agent tool call:
  subagent_type: general-purpose
  prompt: [contents of .claude/agents/qa.md] + "\n\n## Changes to Review\n[specialist's output + diff]"
```

QA returns APPROVED or CHANGES REQUESTED with specific issues.

### Step 5 — Iterate or implement

- If **APPROVED**: apply the changes (merge the worktree branch)
- If **CHANGES REQUESTED**: send the issues back to the specialist and re-run from Step 3

---

## Shorthand for Common Requests

You don't need to manually manage this — just tell the main Claude session what you want. Say:

> "Run the swarm pipeline on: [your feature/bug request]"

And Claude will orchestrate Steps 1–4 automatically.

---

## Cross-Domain Changes

Some requests touch multiple domains (e.g., "add a difficulty field" touches database + data + frontend). The PM will identify all affected agents and Claude will:

1. Run **database** agent first (schema + types must exist before queries)
2. Run **data** agent second (queries against the new schema)
3. Run **frontend** agent third (UI to display/edit the new field)
4. Run **QA** agent once at the end reviewing all changes together

Dependencies are explicit in the PM's Task Spec.

---

## Tips for Best Results

- **Be specific in your request** — "add a difficulty field (easy/medium/hard) to the save workout modal" is better than "add difficulty to workouts"
- **One logical change per pipeline run** — don't bundle unrelated features
- **Let PM flag ambiguities** — if PM asks a clarifying question, answer it before the specialist runs
- **Trust QA** — if QA rejects, read the specific issues; they'll pinpoint exactly what needs fixing
