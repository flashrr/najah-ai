# Najah AI — Pilot Launch Kit
# Chapter 1 Mathematics · 10-Day Pilot · 15–25 Students

---

## Kit Contents

| File | Purpose | When to use |
|---|---|---|
| `messages/student-whatsapp.md` | All 10 days of student WhatsApp messages | Send one per day, each morning |
| `messages/parent-whatsapp.md` | 3 parent WhatsApp messages | Day 0, Day 5, Day 10 |
| `forms/student-feedback-form.md` | Google Form questions (copy-paste ready) | Set up before Day 0, send on Day 10 |
| `forms/parent-interview-script.md` | 10-min phone call script (FR + Darija) | Day 10 parent calls |
| `monitoring/daily-sql-queries.sql` | Supabase monitoring queries | Run daily in Supabase SQL editor |
| `coordinator-daily-checklist.md` | Day-by-day action list | Follow each morning during pilot |
| `support-faq.md` | Copy-paste responses to common issues | Keep open on your phone during pilot |

---

## Pre-Launch Checklist (complete before Day 0)

### Product
- [ ] App is live and accessible at your URL
- [ ] Test registration → diagnostic → chapter → lesson → exercise → completion end-to-end yourself
- [x] `chapter_assessments` table exists in Supabase ✓ (confirmed 2026-04-24)
- [x] Chapter 1 has **4 lessons** with 5 exercises each ✓ (confirmed 2026-04-24)
      Fractions and Operations · Simple Equations · Proportionality · Functions and Graphs
- [x] `ai_tutor_logs` table exists ✓ (confirmed 2026-04-24)
- [ ] ⚠️  BLOCKER: Fix lesson order_index — all 4 Chapter 1 lessons have order_index = 1
      Run the SQL in PILOT_LAUNCH_TODO.md before inviting students

### Student Setup
- [ ] Decide: open registration or invite-code gated?
- [ ] If gated: create invite codes in Supabase
- [ ] Collect student emails in advance (optional — makes Supabase verification easier)
- [ ] Replace `[LIEN]` in student messages with your actual app URL

### Communication Setup
- [ ] Create student WhatsApp group — add all students
- [ ] Create parent WhatsApp group — add parents only (separate group)
- [ ] Replace `[Votre Nom]` in all parent messages
- [ ] Replace `[HEURE_DÉBUT]` and `[HEURE_FIN]` in parent Day 10 message

### Forms
- [ ] Create Google Form using `forms/student-feedback-form.md`
- [ ] Test the form yourself
- [ ] Replace `[LIEN_FORMULAIRE]` in Day 10 student message with the actual form URL

### Monitoring
- [x] `monitoring/daily-sql-queries.sql` — `[CHAPTER_1_ID]` replaced with `00000000-0000-0000-0005-000000000001` ✓
- [ ] Run Query 0 in Supabase SQL editor — confirm it executes without error

### Observation Log
- [ ] Create a simple notes document (Google Doc or notes app) to record:
  - Daily completion counts
  - Bug reports received
  - Notable student quotes
  - Parent observations

---

## Quick Reference — Success Targets

| Metric | Target |
|---|---|
| Lesson completion rate | ≥ 60% finish all 3 lessons |
| Score improvement | ≥ +10 points pre→post chapter |
| Student usefulness rating | ≥ 70% rate "useful" or better |
| Parent awareness | ≥ 70% noticed child using app |
| Parent WTP | ≥ 50% would consider 70 MAD/month |
| AI tutor usage | ≥ 30% sent at least 1 question |

---

## Chapter 1 — Confirmed Data (2026-04-24)

| Field | Value |
|---|---|
| UUID | `00000000-0000-0000-0005-000000000001` |
| Title | Chapter 1 — Algebra Foundations |
| Grade | 3AC |
| Lessons | 4 (Fractions · Simple Equations · Proportionality · Functions & Graphs) |
| Exercises per lesson | 5 |
| SQL queries | Already updated — ready to run |
