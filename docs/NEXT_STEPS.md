# Next Steps
**Last updated:** 2026-04-16

---

## BEFORE ANYTHING ELSE — Required Manual Action

> ⚠️ Run these two migrations in Supabase SQL Editor or the V2 features will fail at runtime.

**Step 1:** Open your Supabase project → SQL Editor  
**Step 2:** Paste and run `supabase/migrations/004_v2_features.sql`  
**Step 3:** Paste and run `supabase/migrations/005_v2_seed_weeks_3_4.sql`  

After this, all V2 features (invite codes, tutor persistence, rate limiting, weeks 3-4) will work.

---

## V3 — Next Development Phase

### High Impact, Executable Now

#### V3.1-A: Weekly plan personalization
**What:** Sort lessons so weak-area lessons appear first in the plan  
**Why:** Currently lessons are shown in fixed order regardless of diagnostic results. This defeats the purpose of the diagnostic.  
**How:**
- In `weekly-plan/page.tsx`, fetch `diagnostic_results` for the student
- Compute a "priority score" for each lesson based on how its subject maps to weak scores
- Re-sort lessons within each week by priority (weak-area lessons first)
- Add a small "🎯 Recommended" badge on prioritized lessons

**Effort:** ~2 hours  
**Files:** `src/app/(student)/student/weekly-plan/page.tsx`

---

#### V3.1-B: Week completion celebration
**What:** When student completes all lessons in a week, show a celebration card  
**Why:** Milestone recognition drives retention. This is a high-engagement, low-effort feature.  
**How:**
- In weekly plan, check if all lessons in a week have `status === 'completed'`
- If yes, show a `🏆 Week Complete!` banner card at the top of that week section
- Award 50 bonus points (new RPC call or inline)

**Effort:** ~1 hour  
**Files:** `src/components/WeeklyPlan.tsx`, `src/app/(student)/student/weekly-plan/page.tsx`

---

#### V3.2-A: Lesson re-attempt
**What:** Add "Retry exercises" button that resets the answered state without deleting DB records  
**Why:** Students should be able to practice again. Blocking re-attempt is frustrating.  
**How:**
- Add a `Reset` button in `LessonContent.tsx` exercises tab (only shown after all done)
- Clicking it calls `setAnswered({})` and `setCorrect(0)` — no DB delete
- New attempts are inserted as additional rows in `attempts` (gives better history)

**Effort:** ~30 minutes  
**Files:** `src/app/(student)/student/lessons/[lessonId]/LessonContent.tsx`

---

#### V3.2-B: Student settings page
**What:** `/student/settings` — update display name, view account info  
**Why:** Students have no way to correct their name after registration  
**How:**
- New page with a form that updates `profiles.full_name`
- Shows email (read-only), role, join date
- Add nav link in DashboardLayout for students

**Effort:** ~1 hour  
**Files:** New `src/app/(student)/student/settings/page.tsx`

---

#### V3.3-A: Fix parent invite code error handling
**What:** Show error message if the code is invalid/expired/already used  
**Why:** Currently, entering a bad code silently does nothing. This confuses parents.  
**How:**
- Convert `LinkChildForm` from a server action to a client component
- Call `supabase.rpc('claim_invite_code', ...)` directly from client
- Display error message from the RPC response

**Effort:** ~1 hour  
**Files:** `src/app/(parent)/parent/dashboard/page.tsx`

---

#### V3.6-A: Shared student ID helper
**What:** Extract `getStudentForUser(supabase, userId)` to `src/lib/auth.ts`  
**Why:** Currently fetched independently in diagnostic, invite, dashboard, and other pages  
**How:**
```typescript
// src/lib/auth.ts
export async function getStudentForUser(supabase, userId: string) {
  const { data } = await supabase.from('students').select('*').eq('profile_id', userId).single()
  return data
}
```

**Effort:** ~30 minutes  
**Files:** New `src/lib/auth.ts`, update all pages that duplicate this query

---

### Medium Priority

#### V3.3-B: Parent weekly email report
- Supabase Edge Function triggered by cron (weekly)
- Reads per-child progress, formats summary
- Sends via Resend or Sendgrid
- Requires: `RESEND_API_KEY` or `SENDGRID_API_KEY` env var

#### V3.4-A: Admin analytics
- Which lessons have lowest completion rates
- Which exercises have highest error rates
- Filterable by subject and week

#### V3.5-A: Tutor response quality feedback
- Thumbs up/down on each AI tutor message
- Store in `ai_tutor_logs` or a new `tutor_feedback` table
- Use for future prompt improvement

#### V3.4-B: Admin exercise preview
- Show rendered ExerciseCard preview as admin fills in the form
- Side-by-side form + preview layout

---

### Lower Priority

- Error boundaries on lesson + tutor routes
- E2E smoke tests (Playwright)
- Multi-language UI (Arabic/French)
- Subscription / payment tiers
- Push notifications for parent (when child completes a week)

---

## Execution Order Recommendation

```
1. Apply migrations 004 + 005 in Supabase  ← DO THIS FIRST (manual)
2. V3.2-A  Lesson re-attempt               ← 30 min, high student value
3. V3.1-A  Weekly plan personalization     ← 2 hours, high pedagogical value
4. V3.1-B  Week completion celebration     ← 1 hour, high engagement
5. V3.3-A  Parent invite code error UX     ← 1 hour, removes known friction
6. V3.2-B  Student settings page           ← 1 hour, missing basics
7. V3.6-A  Shared student ID helper        ← 30 min, code hygiene
```
