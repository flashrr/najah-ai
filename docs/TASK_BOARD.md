# Task Board
**Last updated:** 2026-04-16

---

## ✅ DONE

### MVP
- [x] Full schema: 12 tables + RLS + auth triggers
- [x] Seed data: 5 subjects, 4 weeks, 15 lessons (weeks 1-2), 18 exercises
- [x] Auth: login, register, middleware role routing
- [x] Student dashboard: points, streak, progress, badges, diagnostic CTA
- [x] Weekly plan: all weeks + lessons with progress status
- [x] Diagnostic: 13 MCQ questions, saves to DB, shapes plan
- [x] Lesson viewer: 3 tabs (content, exercises, AI tutor)
- [x] Exercise system: MCQ + short answer with instant feedback + explanations
- [x] AI tutor: Socratic chatbot, OpenAI/OpenRouter, logs interactions
- [x] Parent dashboard: per-child metrics, weak areas, recommendations
- [x] Parent weekly report: per-week lesson completion
- [x] Admin dashboard: platform stats
- [x] Admin lessons: CRUD
- [x] Admin exercises: CRUD

### V2
- [x] update_streak called on every student visit (layout.tsx)
- [x] Student invite code page (/student/invite)
- [x] Parent invite code linking (claim_invite_code RPC)
- [x] Diagnostic retake flow (delete + restart)
- [x] Admin lesson edit
- [x] Admin exercise edit
- [x] Tutor session persistence (tutor_sessions table)
- [x] Email confirmation UX on register
- [x] KaTeX math rendering in lesson content
- [x] Loading skeletons (dashboard + weekly plan)
- [x] Mastery threshold: score < 50% blocks lesson completion
- [x] Skill-level analysis on student dashboard from attempts
- [x] AI rate limiting (30 req/hr via api_rate_limits table)
- [x] Adaptive AI prompt (lesson context + weak topics from DB)
- [x] Weeks 3-4 seed data (10 lessons + 27 exercises)
- [x] invite_codes + tutor_sessions + api_rate_limits migration (004)
- [x] update_streak bug fix (unreachable CASE branch)

---

## 🔄 IN PROGRESS

Nothing actively in progress.

---

## 🟡 NEXT (Priority Order)

- [x] Phase D3: Onboarding modal (3-step wizard, localStorage, auto-advance logic)

### V3.1 — Learning Flow
- [ ] Weekly plan personalization: surface weak-area lessons first (based on diagnostic + attempts)
- [ ] Spaced repetition marker: flag lessons matching student's weak skill_tags
- [ ] "Week complete" celebration card when student finishes all lessons in a week
- [ ] Fill in real markdown content for weeks 3-4 lessons (currently placeholder)

### V3.2 — Student Experience
- [ ] Student settings page (/student/settings): update name, view account info
- [ ] Attempt history page: student can review all past attempts by subject
- [ ] Lesson re-attempt: allow redoing exercises (currently blocked after first answer)

### V3.3 — Parent & Reporting
- [ ] Parent weekly email report (Supabase Edge Function cron or manual "Generate" button)
- [ ] Parent can view linked children's individual lesson attempts
- [ ] Parent notification when child completes a week

### V3.4 — Admin & Content
- [ ] Admin: exercise preview panel before save
- [ ] Admin: bulk import exercises (CSV or JSON)
- [ ] Admin: analytics — which lessons have lowest completion rates
- [ ] Admin: student list with filterable progress

### V3.5 — AI Tutor
- [ ] Tutor conversation summary (save a short summary per session for parent view)
- [ ] Subject-specific tutor personas (e.g. stricter for coding, more encouraging for English)
- [ ] Student can rate tutor response (thumbs up/down for quality feedback)

### V3.6 — Technical
- [ ] Apply migrations 004 + 005 in Supabase ⚠️ PENDING
- [ ] Add error boundaries (React ErrorBoundary) to lesson and tutor routes
- [ ] Add Suspense boundaries to replace loading.tsx files for finer control
- [ ] E2E test setup (Playwright or Cypress) — at minimum smoke test auth flow
- [ ] Move student ID fetching to a shared helper (currently duplicated in 3+ pages)

---

## 🔴 BLOCKED

Nothing blocked. Migrations 004+005 are written and ready; they just need to be applied by the user in Supabase.

---

## 🗑️ DEFERRED / PARKED

- Monetization (subscription tiers, Stripe) — parked until product has real users
- Multi-language UI (Arabic/French toggle) — parked for V4+
- Video lesson support — not aligned with short-unit pedagogy; parked
- Real-time collaboration (students helping each other) — complex; parked
