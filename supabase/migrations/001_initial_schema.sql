-- ============================================================
-- Najah AI — Initial Schema Migration
-- v1.1 — FIXED: all tables created before policies that
--         reference them (resolves 42P01 forward-reference errors)
--
-- Safe execution order:
--   Phase 1: Extensions
--   Phase 2: CREATE TABLE (FK dependency order)
--   Phase 3: ALTER TABLE ... ENABLE ROW LEVEL SECURITY
--   Phase 4: CREATE POLICY (all tables exist by now)
--   Phase 5: CREATE FUNCTION + CREATE TRIGGER
-- ============================================================


-- ============================================================
-- PHASE 1 — EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";


-- ============================================================
-- PHASE 2 — CREATE TABLES
-- Order: parents before children in FK dependency graph
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. PROFILES  (references auth.users only)
-- ──────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  role       text not null check (role in ('student', 'parent', 'admin')),
  created_at timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 2. STUDENTS  (references profiles)
-- ──────────────────────────────────────────────
create table public.students (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  level       text not null default '3eme_college',
  school_name text,
  points      integer not null default 0,
  streak_days integer not null default 0,
  last_active date,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 3. PARENT-STUDENT LINKS  (references profiles + students)
-- ──────────────────────────────────────────────
create table public.parent_student_links (
  id                uuid primary key default uuid_generate_v4(),
  parent_profile_id uuid not null references public.profiles(id) on delete cascade,
  student_id        uuid not null references public.students(id) on delete cascade,
  relationship      text default 'parent',
  created_at        timestamptz default now(),
  unique (parent_profile_id, student_id)
);

-- ──────────────────────────────────────────────
-- 4. SUBJECTS  (no foreign key dependencies)
-- ──────────────────────────────────────────────
create table public.subjects (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  name        text not null,
  description text,
  icon        text,
  color       text default '#0ea5e9'
);

-- ──────────────────────────────────────────────
-- 5. WEEKS  (no foreign key dependencies)
-- ──────────────────────────────────────────────
create table public.weeks (
  id          uuid primary key default uuid_generate_v4(),
  week_number integer not null unique,
  title       text not null,
  objective   text
);

-- ──────────────────────────────────────────────
-- 6. LESSONS  (references subjects + weeks)
-- ──────────────────────────────────────────────
create table public.lessons (
  id                uuid primary key default uuid_generate_v4(),
  subject_id        uuid not null references public.subjects(id) on delete cascade,
  week_id           uuid not null references public.weeks(id) on delete cascade,
  title             text not null,
  objective         text,
  content_md        text not null default '',
  estimated_minutes integer not null default 15,
  difficulty        text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  order_index       integer not null default 0,
  created_at        timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 7. EXERCISES  (references lessons)
-- ──────────────────────────────────────────────
create table public.exercises (
  id             uuid primary key default uuid_generate_v4(),
  lesson_id      uuid not null references public.lessons(id) on delete cascade,
  type           text not null check (type in ('mcq', 'short_answer', 'step_by_step')),
  question       text not null,
  options        jsonb,
  correct_answer text not null,
  explanation    text not null default '',
  difficulty     text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  skill_tag      text,
  order_index    integer not null default 0,
  created_at     timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 8. ATTEMPTS  (references students + exercises)
-- ──────────────────────────────────────────────
create table public.attempts (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references public.students(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  answer      text not null,
  is_correct  boolean not null,
  score       numeric(5,2) not null default 0,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 9. LESSON PROGRESS  (references students + lessons)
-- ──────────────────────────────────────────────
create table public.lesson_progress (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid not null references public.students(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  status       text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  score        numeric(5,2),
  completed_at timestamptz,
  created_at   timestamptz default now(),
  unique (student_id, lesson_id)
);

-- ──────────────────────────────────────────────
-- 10. DIAGNOSTIC RESULTS  (references students + subjects)
-- ──────────────────────────────────────────────
create table public.diagnostic_results (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  score      numeric(5,2) not null,
  weak_topics jsonb default '[]',
  created_at timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 11. AI TUTOR LOGS  (references students + subjects + lessons)
-- ──────────────────────────────────────────────
create table public.ai_tutor_logs (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references public.students(id) on delete cascade,
  subject_id    uuid references public.subjects(id),
  lesson_id     uuid references public.lessons(id),
  user_question text not null,
  ai_response   text not null,
  created_at    timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 12. PARENT REPORTS  (references students + weeks)
-- ──────────────────────────────────────────────
create table public.parent_reports (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.students(id) on delete cascade,
  week_id         uuid not null references public.weeks(id) on delete cascade,
  summary         text,
  weak_areas      jsonb default '[]',
  recommendations jsonb default '[]',
  lessons_done    integer default 0,
  avg_score       numeric(5,2) default 0,
  time_minutes    integer default 0,
  created_at      timestamptz default now()
);


-- ============================================================
-- PHASE 3 — ENABLE ROW LEVEL SECURITY (all tables)
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.students            enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.subjects            enable row level security;
alter table public.weeks               enable row level security;
alter table public.lessons             enable row level security;
alter table public.exercises           enable row level security;
alter table public.attempts            enable row level security;
alter table public.lesson_progress     enable row level security;
alter table public.diagnostic_results  enable row level security;
alter table public.ai_tutor_logs       enable row level security;
alter table public.parent_reports      enable row level security;


-- ============================================================
-- PHASE 4 — CREATE POLICIES
-- All tables exist now — cross-table EXISTS references are safe
-- ============================================================

-- ──────────────────────────────────────────────
-- PROFILES policies
-- ──────────────────────────────────────────────
create policy "profiles: owner can read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner can update own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: admin can read all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- STUDENTS policies
-- (parent_student_links now exists — safe to reference)
-- ──────────────────────────────────────────────
create policy "students: student reads own"
  on public.students for select
  using (profile_id = auth.uid());

create policy "students: student updates own"
  on public.students for update
  using (profile_id = auth.uid());

create policy "students: parent reads linked"
  on public.students for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = students.id
        and psl.parent_profile_id = auth.uid()
    )
  );

create policy "students: admin reads all"
  on public.students for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- PARENT-STUDENT LINKS policies
-- ──────────────────────────────────────────────
create policy "links: parent reads own links"
  on public.parent_student_links for select
  using (parent_profile_id = auth.uid());

create policy "links: parent inserts own links"
  on public.parent_student_links for insert
  with check (parent_profile_id = auth.uid());

create policy "links: admin reads all"
  on public.parent_student_links for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- SUBJECTS policies
-- ──────────────────────────────────────────────
create policy "subjects: authenticated users read"
  on public.subjects for select
  using (auth.role() = 'authenticated');

create policy "subjects: admin insert/update/delete"
  on public.subjects for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- WEEKS policies
-- ──────────────────────────────────────────────
create policy "weeks: authenticated users read"
  on public.weeks for select
  using (auth.role() = 'authenticated');

create policy "weeks: admin insert/update/delete"
  on public.weeks for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- LESSONS policies
-- ──────────────────────────────────────────────
create policy "lessons: authenticated users read"
  on public.lessons for select
  using (auth.role() = 'authenticated');

create policy "lessons: admin insert/update/delete"
  on public.lessons for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- EXERCISES policies
-- ──────────────────────────────────────────────
create policy "exercises: authenticated users read"
  on public.exercises for select
  using (auth.role() = 'authenticated');

create policy "exercises: admin insert/update/delete"
  on public.exercises for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- ATTEMPTS policies
-- ──────────────────────────────────────────────
create policy "attempts: student reads own"
  on public.attempts for select
  using (
    exists (
      select 1 from public.students s
      where s.id = attempts.student_id and s.profile_id = auth.uid()
    )
  );

create policy "attempts: student inserts own"
  on public.attempts for insert
  with check (
    exists (
      select 1 from public.students s
      where s.id = attempts.student_id and s.profile_id = auth.uid()
    )
  );

create policy "attempts: parent reads linked child"
  on public.attempts for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = attempts.student_id
        and psl.parent_profile_id = auth.uid()
    )
  );

create policy "attempts: admin reads all"
  on public.attempts for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- LESSON PROGRESS policies
-- ──────────────────────────────────────────────
create policy "lesson_progress: student reads own"
  on public.lesson_progress for select
  using (
    exists (
      select 1 from public.students s
      where s.id = lesson_progress.student_id and s.profile_id = auth.uid()
    )
  );

create policy "lesson_progress: student inserts/updates own"
  on public.lesson_progress for all
  using (
    exists (
      select 1 from public.students s
      where s.id = lesson_progress.student_id and s.profile_id = auth.uid()
    )
  );

create policy "lesson_progress: parent reads linked child"
  on public.lesson_progress for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = lesson_progress.student_id
        and psl.parent_profile_id = auth.uid()
    )
  );

create policy "lesson_progress: admin reads all"
  on public.lesson_progress for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- DIAGNOSTIC RESULTS policies
-- ──────────────────────────────────────────────
create policy "diagnostics: student reads own"
  on public.diagnostic_results for select
  using (
    exists (
      select 1 from public.students s
      where s.id = diagnostic_results.student_id and s.profile_id = auth.uid()
    )
  );

create policy "diagnostics: student inserts own"
  on public.diagnostic_results for insert
  with check (
    exists (
      select 1 from public.students s
      where s.id = diagnostic_results.student_id and s.profile_id = auth.uid()
    )
  );

create policy "diagnostics: parent reads linked child"
  on public.diagnostic_results for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = diagnostic_results.student_id
        and psl.parent_profile_id = auth.uid()
    )
  );

create policy "diagnostics: admin reads all"
  on public.diagnostic_results for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- AI TUTOR LOGS policies
-- ──────────────────────────────────────────────
create policy "tutor_logs: student reads own"
  on public.ai_tutor_logs for select
  using (
    exists (
      select 1 from public.students s
      where s.id = ai_tutor_logs.student_id and s.profile_id = auth.uid()
    )
  );

create policy "tutor_logs: student inserts own"
  on public.ai_tutor_logs for insert
  with check (
    exists (
      select 1 from public.students s
      where s.id = ai_tutor_logs.student_id and s.profile_id = auth.uid()
    )
  );

create policy "tutor_logs: admin reads all"
  on public.ai_tutor_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- PARENT REPORTS policies
-- ──────────────────────────────────────────────
create policy "reports: parent reads linked child"
  on public.parent_reports for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = parent_reports.student_id
        and psl.parent_profile_id = auth.uid()
    )
  );

create policy "reports: student reads own"
  on public.parent_reports for select
  using (
    exists (
      select 1 from public.students s
      where s.id = parent_reports.student_id and s.profile_id = auth.uid()
    )
  );

create policy "reports: admin reads all"
  on public.parent_reports for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ============================================================
-- PHASE 5 — FUNCTIONS AND TRIGGERS
-- ============================================================

-- ──────────────────────────────────────────────
-- Auto-create profile row when a user signs up
-- ──────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────
-- Auto-create student row when a student profile is created
-- ──────────────────────────────────────────────
create or replace function public.handle_new_student_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role = 'student' then
    insert into public.students (profile_id)
    values (new.id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_student_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_student_profile();
