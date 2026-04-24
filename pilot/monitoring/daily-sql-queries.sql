-- =============================================================
-- NAJAH AI PILOT — DAILY MONITORING QUERIES
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/pcthkwjaabtditfniref/sql
-- Project: pcthkwjaabtditfniref
-- Chapter 1: "Chapter 1 — Algebra Foundations"
-- Chapter 1 UUID: 00000000-0000-0000-0005-000000000001  ← already inserted below
-- ⚠️  [CHAPTER_1_ID] has been replaced — queries are ready to run as-is
-- =============================================================


-- =============================================================
-- 0. QUICK DASHBOARD — run this first each morning (30 sec check)
-- =============================================================

SELECT
  s.id                                           AS student_id,
  p.full_name,
  COUNT(lp.id) FILTER (WHERE lp.status = 'completed')   AS lessons_done,
  COUNT(lp.id) FILTER (WHERE lp.status = 'in_progress') AS lessons_in_progress,
  MAX(lp.completed_at)::date                     AS last_completed_date,
  s.points,
  s.streak_days
FROM students s
JOIN profiles p ON p.id = s.profile_id
LEFT JOIN lesson_progress lp ON lp.student_id = s.id
GROUP BY s.id, p.full_name, s.points, s.streak_days
ORDER BY lessons_done DESC, last_completed_date DESC NULLS LAST;


-- =============================================================
-- 1. LESSON COMPLETION — per student
-- =============================================================

-- 1a. Total completions by student
SELECT
  p.full_name,
  COUNT(*) FILTER (WHERE lp.status = 'completed')   AS completed,
  COUNT(*) FILTER (WHERE lp.status = 'in_progress') AS in_progress,
  COUNT(*) FILTER (WHERE lp.status = 'not_started') AS not_started,
  MAX(lp.completed_at)::date                         AS last_activity
FROM lesson_progress lp
JOIN students s ON s.id = lp.student_id
JOIN profiles p ON p.id = s.profile_id
GROUP BY p.full_name
ORDER BY completed DESC;

-- 1b. Which lessons are completed (with scores)
SELECT
  p.full_name,
  l.title                AS lesson_title,
  lp.status,
  lp.score,
  lp.completed_at::date  AS completed_date
FROM lesson_progress lp
JOIN students s  ON s.id  = lp.student_id
JOIN profiles p  ON p.id  = s.profile_id
JOIN lessons l   ON l.id  = lp.lesson_id
WHERE lp.status = 'completed'
ORDER BY p.full_name, lp.completed_at;

-- 1c. Completion funnel — how many students at each stage
SELECT
  COUNT(*) FILTER (WHERE lessons_done >= 1) AS started_lesson_1,
  COUNT(*) FILTER (WHERE lessons_done >= 2) AS finished_lesson_2,
  COUNT(*) FILTER (WHERE lessons_done >= 3) AS finished_all_3
FROM (
  SELECT student_id, COUNT(*) AS lessons_done
  FROM lesson_progress
  WHERE status = 'completed'
  GROUP BY student_id
) sub;


-- =============================================================
-- 2. CHAPTER ASSESSMENT — diagnostic vs evaluation scores
-- Replace [CHAPTER_1_ID] with actual UUID
-- =============================================================

-- 2a. Pre-test vs post-test per student
SELECT
  p.full_name,
  MAX(ca.score) FILTER (WHERE ca.type = 'diagnostic')  AS pre_score,
  MAX(ca.score) FILTER (WHERE ca.type = 'evaluation')  AS post_score,
  MAX(ca.score) FILTER (WHERE ca.type = 'evaluation')
    - MAX(ca.score) FILTER (WHERE ca.type = 'diagnostic') AS improvement
FROM chapter_assessments ca
JOIN students s ON s.id = ca.student_id
JOIN profiles p ON p.id = s.profile_id
WHERE ca.chapter_id = '00000000-0000-0000-0005-000000000001'
GROUP BY p.full_name
ORDER BY improvement DESC NULLS LAST;

-- 2b. Assessment completion counts
SELECT
  type,
  COUNT(*) AS students_completed,
  ROUND(AVG(score), 1) AS avg_score,
  MIN(score) AS min_score,
  MAX(score) AS max_score
FROM chapter_assessments
WHERE chapter_id = '00000000-0000-0000-0005-000000000001'
GROUP BY type;

-- 2c. Students who did evaluation but not diagnostic (edge case)
SELECT p.full_name
FROM chapter_assessments ca
JOIN students s ON s.id = ca.student_id
JOIN profiles p ON p.id = s.profile_id
WHERE ca.chapter_id = '00000000-0000-0000-0005-000000000001'
  AND ca.type = 'evaluation'
  AND ca.student_id NOT IN (
    SELECT student_id FROM chapter_assessments
    WHERE chapter_id = '00000000-0000-0000-0005-000000000001' AND type = 'diagnostic'
  );


-- =============================================================
-- 3. REVIEW QUEUE USAGE
-- (derived from lesson_progress.completed_at freshness)
-- =============================================================

-- 3a. Students who have marked at least one lesson as reviewed
-- (completed_at updated after original completion date)
SELECT
  p.full_name,
  l.title,
  lp.completed_at::date   AS last_reviewed,
  lp.score
FROM lesson_progress lp
JOIN students s ON s.id = lp.student_id
JOIN profiles p ON p.id = s.profile_id
JOIN lessons l  ON l.id = lp.lesson_id
WHERE lp.status = 'completed'
ORDER BY p.full_name, lp.completed_at DESC;

-- 3b. Lessons that are "overdue" for review right now
-- (completed more than 7 days ago — never refreshed)
SELECT
  p.full_name,
  l.title,
  lp.completed_at::date                        AS completed_date,
  CURRENT_DATE - lp.completed_at::date         AS days_since_completion,
  lp.score
FROM lesson_progress lp
JOIN students s ON s.id = lp.student_id
JOIN profiles p ON p.id = s.profile_id
JOIN lessons l  ON l.id = lp.lesson_id
WHERE lp.status = 'completed'
  AND lp.completed_at < NOW() - INTERVAL '7 days'
ORDER BY days_since_completion DESC;


-- =============================================================
-- 4. AI TUTOR USAGE
-- =============================================================

-- 4a. Sessions per student
SELECT
  p.full_name,
  COUNT(*)                     AS total_questions,
  COUNT(DISTINCT DATE(atl.created_at)) AS days_used,
  MIN(atl.created_at)::date    AS first_use,
  MAX(atl.created_at)::date    AS last_use
FROM ai_tutor_logs atl
JOIN students s ON s.id = atl.student_id
JOIN profiles p ON p.id = s.profile_id
GROUP BY p.full_name
ORDER BY total_questions DESC;

-- 4b. Students who NEVER used the AI tutor
SELECT p.full_name
FROM students s
JOIN profiles p ON p.id = s.profile_id
WHERE s.id NOT IN (
  SELECT DISTINCT student_id FROM ai_tutor_logs
)
ORDER BY p.full_name;

-- 4c. Most common question subjects
SELECT subject_id, COUNT(*) AS questions
FROM ai_tutor_logs
GROUP BY subject_id
ORDER BY questions DESC;

-- 4d. Sample questions (for qualitative review — check what confuses students)
SELECT
  p.full_name,
  atl.user_question,
  atl.created_at
FROM ai_tutor_logs atl
JOIN students s ON s.id = atl.student_id
JOIN profiles p ON p.id = s.profile_id
ORDER BY atl.created_at DESC
LIMIT 30;


-- =============================================================
-- 5. INACTIVE STUDENTS — who has gone silent?
-- =============================================================

-- 5a. Students with no activity in the last 2 days
SELECT
  p.full_name,
  COALESCE(MAX(lp.completed_at), MAX(a.created_at))::date AS last_any_activity,
  CURRENT_DATE - COALESCE(MAX(lp.completed_at), MAX(a.created_at))::date AS days_inactive,
  COUNT(lp.id) FILTER (WHERE lp.status = 'completed') AS lessons_done
FROM students s
JOIN profiles p ON p.id = s.profile_id
LEFT JOIN lesson_progress lp ON lp.student_id = s.id
LEFT JOIN attempts a ON a.student_id = s.id
GROUP BY s.id, p.full_name
HAVING COALESCE(MAX(lp.completed_at), MAX(a.created_at)) < NOW() - INTERVAL '2 days'
   OR (MAX(lp.completed_at) IS NULL AND MAX(a.created_at) IS NULL)
ORDER BY days_inactive DESC NULLS FIRST;

-- 5b. Students who registered but never completed a lesson
SELECT p.full_name, s.created_at::date AS joined_date
FROM students s
JOIN profiles p ON p.id = s.profile_id
WHERE s.id NOT IN (
  SELECT DISTINCT student_id FROM lesson_progress WHERE status = 'completed'
)
ORDER BY s.created_at;


-- =============================================================
-- 6. EXERCISE QUALITY SIGNALS
-- (run on Day 5 and Day 10 to check if exercises are calibrated)
-- =============================================================

-- 6a. First-attempt correct rate per exercise
SELECT
  e.question,
  l.title AS lesson,
  COUNT(*) AS total_attempts,
  ROUND(100.0 * SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) / COUNT(*), 1) AS correct_pct
FROM attempts a
JOIN exercises e ON e.id = a.exercise_id
JOIN lessons l ON l.id = e.lesson_id
GROUP BY e.id, e.question, l.title
ORDER BY correct_pct ASC;  -- show hardest exercises first

-- 6b. Exercises with 0% success rate (may indicate a bug or wrong answer key)
SELECT
  e.question,
  e.correct_answer,
  l.title AS lesson,
  COUNT(*) AS attempts
FROM attempts a
JOIN exercises e ON e.id = a.exercise_id
JOIN lessons l ON l.id = e.lesson_id
GROUP BY e.id, e.question, e.correct_answer, l.title
HAVING SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) = 0
  AND COUNT(*) >= 3;  -- only flag if 3+ students tried it


-- =============================================================
-- 7. POINTS AND ENGAGEMENT
-- =============================================================

SELECT
  p.full_name,
  s.points,
  s.streak_days,
  s.last_active::date
FROM students s
JOIN profiles p ON p.id = s.profile_id
ORDER BY s.points DESC;
