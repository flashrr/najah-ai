-- ============================================================
-- Migration 009: onboarding_step column + weekly_plan INSERT policy
-- Applied: 2026-04-19
-- ============================================================
-- Fix 1: OnboardingModal writes onboarding_step to students table but
--   the column did not exist in migration 007 — add it now.
-- Fix 2: weekly_plan_sessions INSERT policy was missing FOR INSERT
--   WITH CHECK, blocking the server-action plan generator.
-- ============================================================

-- 1. Add onboarding_step to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS onboarding_step text NOT NULL DEFAULT '1'
    CHECK (onboarding_step IN ('1','2','3','done'));

-- 2. Add explicit INSERT policy for weekly_plans (student self-generates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'weekly_plans' AND policyname = 'weekly_plans: student inserts own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "weekly_plans: student inserts own"
        ON public.weekly_plans FOR INSERT
        WITH CHECK (EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.id = weekly_plans.student_id AND s.profile_id = auth.uid()
        ))
    $policy$;
  END IF;
END $$;

-- 3. Add explicit INSERT policy for weekly_plan_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'weekly_plan_sessions' AND policyname = 'plan_sessions: student inserts own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "plan_sessions: student inserts own"
        ON public.weekly_plan_sessions FOR INSERT
        WITH CHECK (EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.id = weekly_plan_sessions.student_id AND s.profile_id = auth.uid()
        ))
    $policy$;
  END IF;
END $$;

-- 4. Add UPDATE policy for weekly_plan_sessions (mark complete/skip)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'weekly_plan_sessions' AND policyname = 'plan_sessions: student updates own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "plan_sessions: student updates own"
        ON public.weekly_plan_sessions FOR UPDATE
        USING (EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.id = weekly_plan_sessions.student_id AND s.profile_id = auth.uid()
        ))
    $policy$;
  END IF;
END $$;
