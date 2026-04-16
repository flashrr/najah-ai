# Known Issues
**Last updated:** 2026-04-16

---

## 🔴 CRITICAL (blocks core functionality)

### ISSUE-001: Migrations 004 + 005 not yet applied in Supabase
**Affects:** Invite codes, tutor session persistence, AI rate limiting, weeks 3-4 content  
**Symptom:** Runtime errors when accessing invite page, AI tutor (rate limit check crashes), weeks 3-4 show no exercises  
**Fix:** Run in Supabase SQL Editor:
```
supabase/migrations/004_v2_features.sql
supabase/migrations/005_v2_seed_weeks_3_4.sql
```
**Status:** ⚠️ PENDING — user must apply manually

---

## 🟡 MEDIUM (degrades UX but doesn't break)

### ISSUE-002: Weekly plan shows all lessons without personalization
**Affects:** Student learning flow — learning-science integrity  
**Symptom:** All lessons shown in order regardless of student diagnostic results; no weak-area prioritization  
**Fix needed:** Sort/tag lessons by match with `diagnostic_results.weak_topics`; surface high-priority lessons first  
**Status:** Deferred to V3.1

### ISSUE-003: Weeks 3-4 lesson content is placeholder markdown
**Affects:** Learning quality for weeks 3-4  
**Symptom:** Lessons display structural outline but lack full explanations, examples, and worked problems  
**Fix needed:** Write actual pedagogical content for 10 lessons (could use AI to draft, admin to review)  
**Status:** Deferred — content work, not code work

### ISSUE-004: No error boundary on lesson or AI tutor routes
**Affects:** User experience when AI API fails or DB query errors  
**Symptom:** Whole page crashes instead of showing a graceful error card  
**Fix needed:** Add React `ErrorBoundary` wrapper around `LessonContent` and `TutorChat`  
**Status:** Deferred to V3.6

### ISSUE-005: Student ID fetched in multiple pages independently
**Affects:** Code maintainability  
**Symptom:** `supabase.from('students').select('id').eq('profile_id', user.id)` duplicated in diagnostic, invite, dashboard pages  
**Fix needed:** Extract to a shared `getStudentId(supabase, userId)` helper in `src/lib/auth.ts`  
**Status:** Deferred to V3.6

---

## 🟢 LOW (minor, known)

### ISSUE-006: `parent_reports` table exists but is never written to
**Affects:** Parent reporting feature  
**Symptom:** Table in schema, no code populates it  
**Fix needed:** Decide: cron-based weekly snapshot vs manual "Generate report" button  
**Status:** Deferred to V3.3

### ISSUE-007: Lesson re-attempt not supported
**Affects:** Student learning iteration  
**Symptom:** Once a student answers an exercise, they cannot redo it in a new session (attemptedSet prevents it)  
**Fix needed:** Add a "Retry exercises" button that clears `attemptedSet` state (without deleting DB records)  
**Status:** Deferred to V3.2

### ISSUE-008: Invite code UI can't show server-side claim errors
**Affects:** Parent UX when entering an invalid/expired code  
**Symptom:** If `claim_invite_code` returns `success: false`, the form silently does nothing (Server Action can't return error to UI)  
**Fix needed:** Convert `LinkChildForm` from server action to client component with proper error state  
**Status:** Known limitation of the server action pattern — deferred to V3.1

### ISSUE-009: No Suspense boundaries on lesson page tabs
**Affects:** Performance during tab switching  
**Symptom:** When switching to AI Tutor tab, TutorChat re-renders and shows loading flash even if session was recently loaded  
**Fix needed:** Stable component identity or React.memo on TutorChat  
**Status:** Low priority

### ISSUE-010: Math rendering (KaTeX) requires content authors to use LaTeX syntax
**Affects:** Admin-created lesson content  
**Symptom:** If admin writes `x²` instead of `$x^2$`, math won't render as formatted  
**Fix needed:** Add admin content guide / tooltip explaining LaTeX math syntax  
**Status:** Documentation/UX issue, not code

---

## ✅ RESOLVED (historical)

| Issue | Fix applied |
|---|---|
| Migration 001 forward-reference: "students: parent reads linked" policy referenced parent_student_links before it existed | Rewrote 001 in 5-phase order: CREATE TABLE → ENABLE RLS → CREATE POLICY → FUNCTIONS/TRIGGERS |

| Issue | Fix applied |
|---|---|
| next.config.ts unsupported in Next.js 14 | Renamed to next.config.mjs |
| update_streak unreachable CASE branch | Rewrote with if/elsif/else |
| .catch() on PostgrestFilterBuilder | Wrapped in try/catch |
| Stale closure in diagnostic saveResults | Compute updatedAnswers synchronously |
| Missing revalidatePath in parent LinkChildForm | Added import + call |
| CVE in next@14.2.5 | Updated to 14.2.35 |
| @tailwindcss/typography missing | Installed + configured |
| Supabase join typed as array | Normalized at page level |
| Parent linking via UUID (bad UX) | Replaced with XXXX-XXXX invite codes |
| No email confirmation UX on register | Added check + confirmation screen |
