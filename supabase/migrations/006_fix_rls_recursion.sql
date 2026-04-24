-- ============================================================
-- Migration 006: Fix infinite recursion in RLS admin policies
-- ============================================================
-- Root cause: policies on profiles/students/etc that check admin
-- role by querying public.profiles from within a profiles policy
-- create infinite recursion (code 42P17).
--
-- Fix: replace all subquery-based admin checks with JWT metadata
-- lookup: (auth.jwt()->'user_metadata'->>'role') = 'admin'
-- This reads the signed JWT — no DB query, no recursion possible.
-- ============================================================

-- 1. profiles: admin can read all
DROP POLICY IF EXISTS "profiles: admin can read all" ON public.profiles;
CREATE POLICY "profiles: admin can read all"
  ON public.profiles FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 2. students: admin reads all
DROP POLICY IF EXISTS "students: admin reads all" ON public.students;
CREATE POLICY "students: admin reads all"
  ON public.students FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 3. students: admin updates all (add if needed by admin flow)
DROP POLICY IF EXISTS "students: admin updates all" ON public.students;
CREATE POLICY "students: admin updates all"
  ON public.students FOR UPDATE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 4. parent_student_links: admin reads all
DROP POLICY IF EXISTS "links: admin reads all" ON public.parent_student_links;
CREATE POLICY "links: admin reads all"
  ON public.parent_student_links FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 5. subjects: admin all operations
DROP POLICY IF EXISTS "subjects: admin insert/update/delete" ON public.subjects;
CREATE POLICY "subjects: admin insert/update/delete"
  ON public.subjects FOR ALL
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 6. weeks: admin all operations
DROP POLICY IF EXISTS "weeks: admin insert/update/delete" ON public.weeks;
CREATE POLICY "weeks: admin insert/update/delete"
  ON public.weeks FOR ALL
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 7. lessons: admin all operations
DROP POLICY IF EXISTS "lessons: admin insert/update/delete" ON public.lessons;
CREATE POLICY "lessons: admin insert/update/delete"
  ON public.lessons FOR ALL
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 8. exercises: admin all operations
DROP POLICY IF EXISTS "exercises: admin insert/update/delete" ON public.exercises;
CREATE POLICY "exercises: admin insert/update/delete"
  ON public.exercises FOR ALL
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 9. attempts: admin reads all
DROP POLICY IF EXISTS "attempts: admin reads all" ON public.attempts;
CREATE POLICY "attempts: admin reads all"
  ON public.attempts FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 10. lesson_progress: admin reads all
DROP POLICY IF EXISTS "lesson_progress: admin reads all" ON public.lesson_progress;
CREATE POLICY "lesson_progress: admin reads all"
  ON public.lesson_progress FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 11. diagnostic_results: admin reads all
DROP POLICY IF EXISTS "diagnostics: admin reads all" ON public.diagnostic_results;
CREATE POLICY "diagnostics: admin reads all"
  ON public.diagnostic_results FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 12. ai_tutor_logs: admin reads all
DROP POLICY IF EXISTS "tutor_logs: admin reads all" ON public.ai_tutor_logs;
CREATE POLICY "tutor_logs: admin reads all"
  ON public.ai_tutor_logs FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 13. invite_codes: admin reads all (v2 table)
DROP POLICY IF EXISTS "invite: admin reads all" ON public.invite_codes;
CREATE POLICY "invite: admin reads all"
  ON public.invite_codes FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 14. tutor_sessions: admin reads all (v2 table)
DROP POLICY IF EXISTS "tutor_sessions: admin reads all" ON public.tutor_sessions;
CREATE POLICY "tutor_sessions: admin reads all"
  ON public.tutor_sessions FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- 15. parent_reports: admin reads all (if policy exists)
DROP POLICY IF EXISTS "reports: admin reads all" ON public.parent_reports;
CREATE POLICY "reports: admin reads all"
  ON public.parent_reports FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );
