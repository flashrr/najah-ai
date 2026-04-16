# Najah AI — Master README

## Project Identity
**Najah AI** is a Moroccan EdTech platform for 3ème collège students (ages 14–16).  
It delivers personalized learning through diagnostics, weekly plans, AI tutoring, mastery tracking, and parent reporting.

## Locations
| What | Path |
|---|---|
| App source | `D:/najah_ai_professional_claude_code_skills_pack/najah-ai/` |
| Spec pack | `D:/najah_ai_professional_claude_code_skills_pack/najah_ai_pro_claude_code_pack/` |
| Memory files | `najah-ai/00_READ_FIRST/` and `najah-ai/docs/` |

## Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.35 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4 + @tailwindcss/typography |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password) |
| SSR client | @supabase/ssr (latest) |
| AI | OpenAI SDK (gpt-4o-mini default) or OpenRouter |
| Math rendering | remark-math + rehype-katex + katex |

## User Roles
| Role | Dashboard | Core flows |
|---|---|---|
| `student` | `/student/dashboard` | Diagnostic → Weekly plan → Lessons → AI Tutor → Invite parent |
| `parent` | `/parent/dashboard` | View child progress → Link child via invite code |
| `admin` | `/admin/dashboard` | Manage lessons and exercises (CRUD with edit) |

## Subjects
| Slug | Name | Icon |
|---|---|---|
| math | Mathematics | ➕ |
| physics | Physics-Chemistry | ⚗️ |
| english | English | 🇬🇧 |
| logic | Logic / IQ | 🧩 |
| coding | Coding Basics | 💻 |

## Core Pedagogy Rules
1. Diagnostic-first: assess level before prescribing content
2. Mastery threshold: score ≥ 50% required to complete a lesson
3. Immediate feedback with explanations on every exercise
4. AI tutor uses Socratic method — guides, never dumps answers
5. Weak-topic detection from both diagnostic results and attempt history
6. Spaced reinforcement: weak topics should resurface in the weekly plan
7. Parent visibility into scores, weak areas, and weekly recommendations
8. Rate-limited AI (30 req/hr) to prevent abuse

## Environment Variables
```
# REQUIRED
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=

# OPTIONAL
AI_PROVIDER=openai          # or openrouter
AI_MODEL=gpt-4o-mini        # any OpenAI/OpenRouter model
OPENROUTER_API_KEY=         # only needed if AI_PROVIDER=openrouter
```

## Quick Start
```cmd
cd najah-ai
npm install
# copy .env.local.example to .env.local and fill in values
npm run dev
```

## Memory System
Always read these files at the start of a session:
1. `00_READ_FIRST/README_MASTER.md` (this file)
2. `00_READ_FIRST/CURRENT_BUILD_STATE.md`
3. `00_READ_FIRST/SESSION_HANDOFF.md`
4. `docs/TASK_BOARD.md`
5. `docs/KNOWN_ISSUES.md`
6. `docs/NEXT_STEPS.md`
