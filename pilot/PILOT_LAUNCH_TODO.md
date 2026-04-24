# PILOT LAUNCH TODO — Manual Steps Required
# Generated: 2026-04-24
# Complete all items before sending Day 0 messages to students.

---

## 🔴 BLOCKER — Fix before inviting any students

### 1. Fix lesson order_index (all 4 Chapter 1 lessons are set to order_index = 1)

Without this fix, lessons appear in arbitrary order in the Chapter view.
Run this SQL in Supabase → SQL Editor:

```sql
UPDATE lessons SET order_index = 1
WHERE id = '00000000-0000-0000-0003-000000000001';  -- Fractions and Operations

UPDATE lessons SET order_index = 2
WHERE id = '00000000-0000-0000-0003-000000000006';  -- Simple Equations

UPDATE lessons SET order_index = 3
WHERE id = '00000000-0000-0000-0003-000000000011';  -- Proportionality

UPDATE lessons SET order_index = 4
WHERE id = '00000000-0000-0000-0003-000000000016';  -- Functions and Graphs
```

Verify after running:
```sql
SELECT title, order_index FROM lessons
WHERE chapter_id = '00000000-0000-0000-0005-000000000001'
ORDER BY order_index;
```
Expected: 4 rows, order_index 1 through 4.

---

## 🟡 REQUIRED — Fill before Day 0

### 2. Get your app URL
- Deploy to Vercel (or confirm your current deployment URL)
- URL format: `https://najah-ai.vercel.app` or your custom domain
- Replace `[LIEN]` in:  `pilot/messages/student-whatsapp.md` (Day 0 message)

### 3. Create the Google Form
- Follow: `pilot/forms/student-feedback-form.md`
- Takes ~20 minutes to set up
- After creating, copy the share link
- Replace `[LIEN_FORMULAIRE]` in: `pilot/messages/student-whatsapp.md` (Day 10 message)

### 4. Add your name to parent messages
- Open: `pilot/messages/parent-whatsapp.md`
- Replace both occurrences of `[Votre Nom]` with your actual name
- Message 1 (Day 0) and Message 3 (Day 10) both contain this placeholder

### 5. Set your parent call time window
- Open: `pilot/messages/parent-whatsapp.md`
- Message 3 (Day 10): replace `[HEURE_DÉBUT]` and `[HEURE_FIN]`
- Example: "entre 15h00 et 19h00"

---

## 🔵 SETUP — Required before Day 0

### 6. Create student invite codes
Current invite codes in Supabase are tied to specific existing student_ids and will
not work for new pilot students. You need new codes.

**Option A — Open registration (simplest for pilot):**
No codes needed. Students register freely. You verify their emails match your list.

**Option B — Gated with invite codes:**
Run this SQL for each pilot student (repeat 15–25 times, changing the description):
```sql
-- Create one shared pilot code valid for 30 days
-- (check your invite_codes table schema first to confirm column names)
-- Your current table columns: id, code, student_id, used, used_by, expires_at, created_at
-- Note: current schema is one code per student — create one per student if gated
```
⚠️ Your current `invite_codes` table is one-code-per-student (not a shared code).
Recommend switching to **open registration** for the pilot to reduce friction.
Decide: open or gated, and set up accordingly.

### 7. Create WhatsApp groups
- Group 1: **Najah AI Pilote — Élèves** (students only, you as admin)
- Group 2: **Najah AI Pilote — Parents** (parents only, you as admin)
- Add all participants before sending Day 0 messages
- Do NOT mix students and parents in the same group

### 8. Build your student roster
Create a simple spreadsheet with:
| Prénom | Email | WhatsApp | Parent name | Parent WhatsApp |
|---|---|---|---|---|
| (fill in) | | | | |

You need this to:
- Track who registered vs who is stuck
- Send personalized Day 8 catch-up messages (needs `[Prénom]` and `[X leçon(s)]`)
- Know which parent to call on Day 10

### 9. Create observation log
Create a Google Doc or Notion page titled "Najah AI Pilot — Observation Log"
Paste this template and fill in each day:

```
DAY 1 — [date]
Students registered: ___ / ___
Lessons completed today: ___
AI tutor questions: ___
Support requests: ___
Notable observations:

DAY 2 — [date]
...
```

---

## 🟢 CONFIRMED — Already done, no action needed

| Item | Status |
|---|---|
| Chapter 1 exists in DB | ✅ UUID: 00000000-0000-0000-0005-000000000001 |
| 4 lessons in Chapter 1 | ✅ All with 5 exercises each |
| `chapter_assessments` table | ✅ Exists |
| `ai_tutor_logs` table | ✅ Exists |
| SQL monitoring queries | ✅ CHAPTER_1_ID replaced — ready to run |
| Student messages lesson count | ✅ Fixed to 4 lessons |
| Pilot kit files | ✅ All 8 files in `pilot/` |

---

## 📋 SEND ORDER ON DAY 0

1. Send **parent briefing** first (parent group) → give them 30 min to read
2. Send **student onboarding** (student group) → be available for 2 hours
3. Monitor Supabase → confirm students are registering and creating `students` rows
4. Help any stuck students directly via 1:1 WhatsApp

---

## ⚠️ KNOWN ISSUES TO WATCH DURING PILOT

| Issue | Risk | Watch for |
|---|---|---|
| Student scores < 50% on exercises | Blocked from completing lesson | Check `lesson_progress` for 'in_progress' rows stuck > 2 days |
| Invite code friction (if gated) | Drop-off at registration | Track registration failures on Day 0 |
| AI tutor hallucination | Wrong math answer given | Monitor `ai_tutor_logs.ai_response` for "0%" questions |
| Chapter assessment with no quiz exercises | Empty test screen | Confirm quiz exercises exist before pilot — they do ✓ |
| Mobile layout issues | UX friction | Ask all Day 0 registrants what device they used |
