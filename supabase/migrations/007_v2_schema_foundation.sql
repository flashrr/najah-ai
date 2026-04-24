-- ============================================================
-- Migration 007: V2 Schema Foundation
-- Safe order: columns → seed data → tables (FK order) → RLS
-- Applied: 2026-04-18
-- ============================================================

-- ============================================================
-- PART 1 — New students columns
-- All nullable or with defaults — safe to add to existing rows
-- ============================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS target_study_minutes integer NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS timezone            text    NOT NULL DEFAULT 'Africa/Casablanca',
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

-- ============================================================
-- PART 2 — Missing subjects (idempotent — skip if slug exists)
-- ============================================================

INSERT INTO public.subjects (slug, name, description, icon, color)
VALUES
  ('francais',     'Français',            'Langue française — grammaire, conjugaison et expression', '📝', '#3b82f6'),
  ('histoire-geo', 'Histoire-Géographie', 'Histoire du Maroc et du monde, géographie humaine',      '🌍', '#84cc16'),
  ('coding',       'Coding Basics',       'Introduction à la programmation et à la logique',         '💻', '#ef4444')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PART 3 — New tables (FK dependency order)
-- ============================================================

-- 1. SCHOOL TIMETABLE
-- When the student is at school (blocked time)
CREATE TABLE IF NOT EXISTS public.school_timetable (
  id          uuid      PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  uuid      NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  day_of_week smallint  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun … 6=Sat
  start_time  time      NOT NULL,
  end_time    time      NOT NULL,
  label       text,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT chk_school_time CHECK (end_time > start_time),
  UNIQUE (student_id, day_of_week, start_time)
);
CREATE INDEX IF NOT EXISTS idx_school_timetable_student ON public.school_timetable (student_id);

-- 2. FREE TIME SLOTS
-- When the student is available to study
CREATE TABLE IF NOT EXISTS public.free_time_slots (
  id          uuid      PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  uuid      NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  day_of_week smallint  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  time      NOT NULL,
  end_time    time      NOT NULL,
  label       text,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT chk_free_time CHECK (end_time > start_time),
  UNIQUE (student_id, day_of_week, start_time)
);
CREATE INDEX IF NOT EXISTS idx_free_time_slots_student ON public.free_time_slots (student_id);

-- 3. WEEKLY PLANS
-- One generated plan per student per week
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_id      uuid REFERENCES public.weeks(id) ON DELETE SET NULL,
  title        text NOT NULL DEFAULT 'Weekly Study Plan',
  status       text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'archived')),
  generated_at timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_student ON public.weekly_plans (student_id, status);

-- 4. WEEKLY PLAN SESSIONS
-- Individual scheduled study blocks inside a plan
CREATE TABLE IF NOT EXISTS public.weekly_plan_sessions (
  id               uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id          uuid    NOT NULL REFERENCES public.weekly_plans(id) ON DELETE CASCADE,
  student_id       uuid    NOT NULL REFERENCES public.students(id)    ON DELETE CASCADE,
  lesson_id        uuid    REFERENCES public.lessons(id)  ON DELETE SET NULL,
  subject_id       uuid    REFERENCES public.subjects(id) ON DELETE SET NULL,
  scheduled_date   date    NOT NULL,
  scheduled_time   time,
  duration_minutes integer NOT NULL DEFAULT 30,
  status           text    NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','in_progress','completed','skipped')),
  order_index      integer NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plan_sessions_plan    ON public.weekly_plan_sessions (plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_sessions_student ON public.weekly_plan_sessions (student_id, scheduled_date);

-- 5. STUDENT SESSION LOGS
-- Actual study time recorded (may or may not tie to a plan session)
CREATE TABLE IF NOT EXISTS public.student_session_logs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  plan_session_id uuid REFERENCES public.weekly_plan_sessions(id) ON DELETE SET NULL,
  lesson_id       uuid REFERENCES public.lessons(id)  ON DELETE SET NULL,
  subject_id      uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  duration_minutes integer,
  score           numeric(5,2),
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_session_logs_student ON public.student_session_logs (student_id, started_at DESC);

-- 6. STUDENT WEAK SKILLS
-- Aggregated per-skill mastery (upserted after each attempt batch)
CREATE TABLE IF NOT EXISTS public.student_weak_skills (
  id          uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  uuid    NOT NULL REFERENCES public.students(id)    ON DELETE CASCADE,
  subject_id  uuid    REFERENCES public.subjects(id) ON DELETE SET NULL,
  skill_tag   text    NOT NULL,
  attempts    integer NOT NULL DEFAULT 0,
  correct     integer NOT NULL DEFAULT 0,
  mastery_pct numeric(5,2) NOT NULL DEFAULT 0,
  last_seen_at timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (student_id, skill_tag)
);
CREATE INDEX IF NOT EXISTS idx_weak_skills_student ON public.student_weak_skills (student_id, mastery_pct);

-- 7. NOTIFICATIONS
-- In-app notifications (reminders, achievements, reports)
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('reminder','achievement','report','system')),
  title      text NOT NULL,
  body       text NOT NULL,
  read       boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_student ON public.notifications (student_id, read, created_at DESC);

-- 8. WEEKLY REPORTS (v2)
-- Richer weekly summaries replacing parent_reports for v2 parent dashboard
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id              uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      uuid    NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_start      date    NOT NULL,
  week_end        date    NOT NULL,
  total_minutes   integer NOT NULL DEFAULT 0,
  lessons_done    integer NOT NULL DEFAULT 0,
  exercises_done  integer NOT NULL DEFAULT 0,
  avg_score       numeric(5,2) DEFAULT 0,
  weak_skills     jsonb NOT NULL DEFAULT '[]',
  strong_skills   jsonb NOT NULL DEFAULT '[]',
  recommendations jsonb NOT NULL DEFAULT '[]',
  streak_days     integer DEFAULT 0,
  generated_at    timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  CONSTRAINT chk_week_range CHECK (week_end >= week_start),
  UNIQUE (student_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_student ON public.weekly_reports (student_id, week_start DESC);

-- ============================================================
-- PART 4 — Enable RLS on all new tables
-- ============================================================

ALTER TABLE public.school_timetable      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_time_slots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plan_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_session_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_weak_skills   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 5 — RLS Policies
-- Pattern: JWT admin check (no recursion), students FK for student rows
-- ============================================================

-- ── school_timetable ──────────────────────────────────────────
CREATE POLICY "school_timetable: student reads own"
  ON public.school_timetable FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = school_timetable.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "school_timetable: student manages own"
  ON public.school_timetable FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = school_timetable.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "school_timetable: admin reads all"
  ON public.school_timetable FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── free_time_slots ───────────────────────────────────────────
CREATE POLICY "free_time_slots: student reads own"
  ON public.free_time_slots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = free_time_slots.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "free_time_slots: student manages own"
  ON public.free_time_slots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = free_time_slots.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "free_time_slots: admin reads all"
  ON public.free_time_slots FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── weekly_plans ──────────────────────────────────────────────
CREATE POLICY "weekly_plans: student reads own"
  ON public.weekly_plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = weekly_plans.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "weekly_plans: student manages own"
  ON public.weekly_plans FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = weekly_plans.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "weekly_plans: parent reads linked child"
  ON public.weekly_plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.student_id = weekly_plans.student_id
      AND psl.parent_profile_id = auth.uid()
  ));

CREATE POLICY "weekly_plans: admin reads all"
  ON public.weekly_plans FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── weekly_plan_sessions ──────────────────────────────────────
CREATE POLICY "plan_sessions: student reads own"
  ON public.weekly_plan_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = weekly_plan_sessions.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "plan_sessions: student manages own"
  ON public.weekly_plan_sessions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = weekly_plan_sessions.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "plan_sessions: parent reads linked child"
  ON public.weekly_plan_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.student_id = weekly_plan_sessions.student_id
      AND psl.parent_profile_id = auth.uid()
  ));

CREATE POLICY "plan_sessions: admin reads all"
  ON public.weekly_plan_sessions FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── student_session_logs ──────────────────────────────────────
CREATE POLICY "session_logs: student reads own"
  ON public.student_session_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_session_logs.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "session_logs: student inserts own"
  ON public.student_session_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_session_logs.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "session_logs: student updates own"
  ON public.student_session_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_session_logs.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "session_logs: parent reads linked child"
  ON public.student_session_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.student_id = student_session_logs.student_id
      AND psl.parent_profile_id = auth.uid()
  ));

CREATE POLICY "session_logs: admin reads all"
  ON public.student_session_logs FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── student_weak_skills ───────────────────────────────────────
CREATE POLICY "weak_skills: student reads own"
  ON public.student_weak_skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_weak_skills.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "weak_skills: student manages own"
  ON public.student_weak_skills FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_weak_skills.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "weak_skills: parent reads linked child"
  ON public.student_weak_skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.student_id = student_weak_skills.student_id
      AND psl.parent_profile_id = auth.uid()
  ));

CREATE POLICY "weak_skills: admin reads all"
  ON public.student_weak_skills FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── notifications ─────────────────────────────────────────────
CREATE POLICY "notifications: student reads own"
  ON public.notifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = notifications.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "notifications: student marks read"
  ON public.notifications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = notifications.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "notifications: admin manages all"
  ON public.notifications FOR ALL
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── weekly_reports ────────────────────────────────────────────
CREATE POLICY "weekly_reports: student reads own"
  ON public.weekly_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = weekly_reports.student_id AND s.profile_id = auth.uid()
  ));

CREATE POLICY "weekly_reports: parent reads linked child"
  ON public.weekly_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.student_id = weekly_reports.student_id
      AND psl.parent_profile_id = auth.uid()
  ));

CREATE POLICY "weekly_reports: admin manages all"
  ON public.weekly_reports FOR ALL
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');
