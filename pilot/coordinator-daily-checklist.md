# Coordinator Daily Checklist — Najah AI Pilot
# 10-day pilot · Chapter 1 Mathematics

For each day: run queries → send message → handle support → note observations.
Total time per day: 10–15 minutes (excluding support calls).

---

## DAY 0 — Launch Day

**Before sending anything:**
- [ ] App is live at your URL — test login yourself
- [ ] Invite codes are created (if gated registration)
- [ ] Student WhatsApp group created — all students added
- [ ] Parent WhatsApp group created — all parents added (separate group)
- [ ] Google Form is created and tested — link ready

**Actions:**
- [ ] Send student onboarding message (see `messages/student-whatsapp.md` Day 0)
- [ ] Send parent briefing message (see `messages/parent-whatsapp.md` Message 1)
- [ ] Be available for support for 2 hours after sending
- [ ] Verify in Supabase: count of `students` rows = number of students who registered

**Observation to note:**
> How many students registered within the first hour? How many needed help?

---

## DAY 1

**Morning check (08h00 — 5 min):**
- [ ] Open Supabase → run Query 0 (Quick Dashboard)
- [ ] Note: who already has completed_at from yesterday (early birds)

**Send:**
- [ ] Day 1 student WhatsApp message (diagnostic + first lesson)

**Evening check (20h00 — 5 min):**
- [ ] Re-run Query 0 — how many completed Lesson 1?
- [ ] Run Query 4d — any AI tutor questions today?

**If < 30% have completed Lesson 1 by evening:**
> Send this nudge: "Rappel rapide — si tu n'as pas encore commencé le diagnostic, ça prend 5 minutes ! Je suis là si tu bloques."

**Observation to note:**
> Where did most students drop off? Diagnostic? Chapter overview? Lesson 1?

---

## DAY 2

**Morning check (08h00):**
- [ ] Run Query 1a (completion by student)
- [ ] Identify students with 0 completions → note their names

**Send:**
- [ ] Day 2 student WhatsApp message (Lesson 2)

**Support watch:**
- [ ] Check group for any support questions
- [ ] Students with 0 completions: consider sending a personal 1:1 WhatsApp

**Observation to note:**
> Any recurring question type in the AI tutor logs? Any exercises multiple students failed?

---

## DAY 3

**Morning check (08h00):**
- [ ] Run Query 1c (completion funnel)
- [ ] Run Query 5a (inactive students)

**Send:**
- [ ] Day 3 student WhatsApp message (Lesson 3 + Review Queue)

**If any student is inactive for 2+ days:**
> Send personal 1:1 message: "Salam [Prénom] ! Tout va bien ? Tu peux encore rejoindre le groupe, il reste [X] jours."

**Observation to note:**
> Did any students try the review queue today? (Check Query 3a)

---

## DAY 4

**Morning check (09h00):**
- [ ] Run Query 0 (full dashboard)
- [ ] Run Query 6a (exercise success rates) — flag any exercise with < 20% correct

**Send:**
- [ ] Day 4 student WhatsApp message (progress encouragement)

**If an exercise has 0% success rate:**
> Check the exercise in Supabase `exercises` table. Is the `correct_answer` field exact-match correct?
> If it's a bug: fix the answer in Supabase directly (no migration needed for data fix).

**Observation to note:**
> What is the distribution of lesson scores? Are students hitting the 50% threshold or being blocked?

---

## DAY 5

**Morning check (08h00):**
- [ ] Run Query 2a (pre vs post chapter scores) — how many have both rows?
- [ ] Run Query 2b (assessment summary)

**Send:**
- [ ] Day 5 student WhatsApp message (Chapter Evaluation)
- [ ] Day 5 parent WhatsApp check-in message

**Evening check (20h00):**
- [ ] Re-run Query 2a — how many students improved?
- [ ] Note improvement distribution: < 0% / 0–10% / 10–25% / > 25%

**Observation to note:**
> Average pre-test score vs average post-test score. Is there measurable improvement?

---

## DAY 6

**Morning (10h00):**
- [ ] Run Query 5b (students who never completed a lesson) — final chance intervention
- [ ] Send Day 6 student WhatsApp message (free practice day)

**For each student with 0 completions — send personal 1:1:**
> "Salam [Prénom]. Il reste 4 jours. Même une seule leçon complète, c'est déjà quelque chose. Tu veux qu'on trouve 20 minutes ensemble ?"

**Observation to note:**
> How many students log in on Day 6 WITHOUT a prompt? (Compare login timestamps in `attempts` table)

---

## DAY 7

**Morning (10h00):**
- [ ] Run Query 4a (AI tutor totals)
- [ ] Run Query 3b (overdue review items)
- [ ] Send Day 7 student WhatsApp message (free practice + review)

**Observation to note:**
> Total AI tutor usage across the pilot so far. Who used it the most?

---

## DAY 8

**Morning (08h00):**
- [ ] Run Query 1a sorted by completions ascending
- [ ] Identify students with < 2 lessons done
- [ ] Send Day 8 catch-up message ONLY to those students (personal message, not group)
- [ ] Continue normal support in the group

**Observation to note:**
> Is any student's score < 50% on all lessons? (They can't complete — this is a potential blocker.)

---

## DAY 9

**Morning (09h00):**
- [ ] Final check on completion counts
- [ ] Run Query 2a — who still hasn't done the evaluation?
- [ ] Send Day 9 message to students still missing evaluation

**Confirm:**
- [ ] Google Form link is live and tested
- [ ] Parent interview slots scheduled for Day 10

**Observation to note:**
> Final completion tally before Day 10.

---

## DAY 10 — Final Day

**Morning (09h00):**
- [ ] Send Day 10 feedback form message to student group
- [ ] Begin parent phone/WhatsApp calls (3–5 calls, 10 min each)
- [ ] Run ALL queries and save results to a spreadsheet

**Data export checklist:**
- [ ] Query 0 — final completion dashboard → paste to spreadsheet
- [ ] Query 2a — pre vs post scores → paste to spreadsheet
- [ ] Query 4a — AI tutor usage → paste to spreadsheet
- [ ] Query 5a — inactive students → paste to spreadsheet
- [ ] Query 6a — exercise difficulty signals → paste to spreadsheet

**End of day:**
- [ ] Send thank-you message to student group: "Shukran bzaf à tous ! Votre retour va aider des centaines d'élèves marocains. 🙏🇲🇦"
- [ ] Send thank-you to parent group
- [ ] Count feedback form responses (aim for ≥ 60% response rate)

---

## Decision template to fill after Day 10:

```
DATE: ___________

COMPLETION RATE: _____ / _____ students finished all 4 lessons = _____%
TARGET: 60%         RESULT: ✅ PASS / ❌ FAIL

AVG PRE-SCORE:  _____%
AVG POST-SCORE: _____%
IMPROVEMENT:    +____%
TARGET: +10 points   RESULT: ✅ PASS / ❌ FAIL

AI TUTOR USAGE: ____% of students used it
TARGET: 30%          RESULT: ✅ PASS / ❌ FAIL

PARENT WTP: ____% would consider paying
TARGET: 50%          RESULT: ✅ PASS / ❌ FAIL

OVERALL VERDICT:  ☐ CONTINUE  ☐ FIX AND RETEST  ☐ PIVOT  ☐ INVESTIGATE
NEXT ACTION: _______________________________________________________
```
