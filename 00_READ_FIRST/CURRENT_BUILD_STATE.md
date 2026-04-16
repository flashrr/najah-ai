# Current Build State
**Last updated:** 2026-04-16  
**Build status:** ✅ Production build passing — 16 routes, 0 TypeScript errors

---

## Phase History
| Phase | Status | Notes |
|---|---|---|
| MVP Phase 1–7 | ✅ COMPLETE | Full scaffold, DB, auth, student, parent, admin, AI |
| Verification & bug fixes | ✅ COMPLETE | 8 bugs fixed, security patches applied |
| V2 SQL Migrations | ✅ COMPLETE | 005 migrations written, 003 streak bug fixed |
| V2.1 Core UX | ✅ COMPLETE | Streak, invite codes, diagnostic retake, admin edit, tutor history, auth UX |
| V2.2 Learning Experience | ✅ COMPLETE | KaTeX math, skeletons, mastery threshold, skill analysis |
| V2.3 AI & Safety | ✅ COMPLETE | Rate limiting, adaptive prompt with lesson context + weak topics |
| V2.4 Technical | ✅ COMPLETE | TypeScript clean, production build verified |
| Phase D3 Onboarding | ✅ COMPLETE | 3-step onboarding modal, localStorage persistence, auto-advance |

---

## All Routes (16 total)

### Public
| Route | Type | Status |
|---|---|---|
| `/` | Static | ✅ Landing page with nav, hero, subjects, features, CTA |
| `/login` | Static | ✅ Client component, role-based redirect after login |
| `/register` | Static | ✅ Role selector, email confirmation UX |

### Student (role-guarded layout + streak update)
| Route | Type | Status |
|---|---|---|
| `/student/dashboard` | Dynamic | ✅ Points, streak, progress, skill analysis, badges |
| `/student/weekly-plan` | Dynamic | ✅ All weeks+lessons with progress indicators |
| `/student/diagnostic` | Dynamic | ✅ 13 questions, 5 subjects, retake flow, saves to DB |
| `/student/lessons/[lessonId]` | Dynamic | ✅ 3 tabs: lesson (KaTeX), exercises, AI tutor |
| `/student/tutor` | Dynamic | ✅ Standalone tutor with session persistence |
| `/student/invite` | Dynamic | ✅ Generates/shows invite code via RPC |

### Parent (role-guarded)
| Route | Type | Status |
|---|---|---|
| `/parent/dashboard` | Dynamic | ✅ Per-child metrics, weak areas, recommendations, invite code linking |
| `/parent/report/[weekId]` | Dynamic | ✅ Per-week lesson completion table |

### Admin (role-guarded)
| Route | Type | Status |
|---|---|---|
| `/admin/dashboard` | Dynamic | ✅ Platform stats, recent students |
| `/admin/lessons` | Dynamic | ✅ Full CRUD with edit |
| `/admin/exercises` | Dynamic | ✅ Full CRUD with edit |

### API
| Route | Status |
|---|---|
| `/api/ai-tutor` | ✅ POST, rate-limited, Socratic, adaptive context |

---

## Components (9)
| Component | Purpose | Status |
|---|---|---|
| `DashboardLayout` | Sticky nav, role-aware, hamburger mobile | ✅ |
| `TutorChat` | Chat UI with session persistence | ✅ |
| `ExerciseCard` | MCQ + short_answer with feedback | ✅ |
| `LessonCard` | Lesson with progress indicator | ✅ |
| `WeeklyPlan` | Week header + grid of LessonCards | ✅ |
| `ProgressBar` | Configurable color/size/label | ✅ |
| `Badge` | Earned/unearned badge display | ✅ |
| `ParentMetricCard` | Icon + value + label card | ✅ |
| `Skeleton` | Loading placeholders (Dashboard + WeeklyPlan) | ✅ |

---

## Database Tables (14)
| Table | Purpose | RLS |
|---|---|---|
| `profiles` | One per auth user, stores role + full_name | ✅ |
| `students` | Extended student data (points, streak) | ✅ |
| `parent_student_links` | Many-to-many parent↔student | ✅ |
| `subjects` | 5 subjects (seed) | ✅ |
| `weeks` | 4 weeks (seed) | ✅ |
| `lessons` | 25 lessons (15 weeks 1-2 + 10 weeks 3-4) | ✅ |
| `exercises` | 45 exercises (18 + 27) | ✅ |
| `attempts` | Per-exercise student responses | ✅ |
| `lesson_progress` | Per-lesson status + score | ✅ |
| `diagnostic_results` | Subject-level scores + weak topics | ✅ |
| `ai_tutor_logs` | AI interaction logging | ✅ |
| `parent_reports` | (schema only, not UI-implemented yet) | ✅ |
| `invite_codes` | XXXX-XXXX codes for parent linking | ✅ |
| `tutor_sessions` | Persistent AI conversation history | ✅ |
| `api_rate_limits` | AI request tracking (server-only) | ✅ |

---

## SQL Migrations
| File | Status | Description |
|---|---|---|
| `001_initial_schema.sql` | ✅ Applied | Full schema + triggers + RLS |
| `002_seed_data.sql` | ✅ Applied | Subjects, 4 weeks, 15 lessons, 18 exercises |
| `003_rpc_functions.sql` | ✅ Applied (fixed) | increment_points, update_streak (fixed bug) |
| `004_v2_features.sql` | ⚠️ NEEDS APPLYING | invite_codes, tutor_sessions, api_rate_limits, RPCs |
| `005_v2_seed_weeks_3_4.sql` | ⚠️ NEEDS APPLYING | 10 lessons + 27 exercises for weeks 3–4 |

> **ACTION REQUIRED:** Migrations 004 and 005 must be run in Supabase SQL Editor.

---

## Key Bug Fixes Applied
| Bug | Fix |
|---|---|
| `next.config.ts` unsupported in Next.js 14 | Renamed to `next.config.mjs` |
| `update_streak` unreachable CASE branch | Rewrote with if/elsif/else logic |
| `.catch()` on PostgrestFilterBuilder | Wrapped in try/catch |
| `'medium' as const` blocks difficulty setter | Cast to union type |
| Supabase join typed as array | Normalized at page level |
| `[...new Set()]` downlevelIteration | Replaced with `Array.from(new Set(...))` |
| Stale closure in diagnostic saveResults | Compute `updatedAnswers` synchronously |
| Missing `revalidatePath` in parent form | Added import + call |
| `@tailwindcss/typography` missing | Installed + added to config |
| CVE in next@14.2.5 | Updated to 14.2.35 |

---

## Packages Installed
```
next@14.2.35
react@18
@supabase/ssr (latest)
@supabase/supabase-js
openai
react-markdown@9
remark-math
rehype-katex
katex
clsx
@tailwindcss/typography
```
