-- ============================================================
-- Najah AI — V2 Feature Tables
-- ============================================================

-- ──────────────────────────────────────────────
-- INVITE CODES (parent-child linking)
-- ──────────────────────────────────────────────
create table public.invite_codes (
  id         uuid primary key default uuid_generate_v4(),
  code       text not null unique,                          -- e.g. "ABCD-E2F3"
  student_id uuid not null references public.students(id) on delete cascade,
  used       boolean not null default false,
  used_by    uuid references public.profiles(id),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz default now()
);

create index on public.invite_codes (code) where not used;
create index on public.invite_codes (student_id);

alter table public.invite_codes enable row level security;

-- Student can read and create their own codes
create policy "invite: student reads own"
  on public.invite_codes for select
  using (
    exists (
      select 1 from public.students s
      where s.id = invite_codes.student_id and s.profile_id = auth.uid()
    )
  );

create policy "invite: student inserts own"
  on public.invite_codes for insert
  with check (
    exists (
      select 1 from public.students s
      where s.id = invite_codes.student_id and s.profile_id = auth.uid()
    )
  );

-- Parent can read a code by its value (needed to look it up before linking)
create policy "invite: anyone authenticated can read by code"
  on public.invite_codes for select
  using (auth.role() = 'authenticated');

-- Admin can read all
create policy "invite: admin reads all"
  on public.invite_codes for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- TUTOR SESSIONS (persistent conversation history)
-- ──────────────────────────────────────────────
create table public.tutor_sessions (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject    text not null,
  lesson_id  uuid references public.lessons(id) on delete set null,
  messages   jsonb not null default '[]',               -- [{role, content}]
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (student_id, subject, lesson_id)               -- one active session per context
);

create index on public.tutor_sessions (student_id, subject, lesson_id);

alter table public.tutor_sessions enable row level security;

create policy "tutor_sessions: student reads own"
  on public.tutor_sessions for select
  using (
    exists (
      select 1 from public.students s
      where s.id = tutor_sessions.student_id and s.profile_id = auth.uid()
    )
  );

create policy "tutor_sessions: student upserts own"
  on public.tutor_sessions for all
  using (
    exists (
      select 1 from public.students s
      where s.id = tutor_sessions.student_id and s.profile_id = auth.uid()
    )
  );

create policy "tutor_sessions: admin reads all"
  on public.tutor_sessions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- API RATE LIMITS (AI tutor abuse protection)
-- ──────────────────────────────────────────────
create table public.api_rate_limits (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  endpoint   text not null default 'ai-tutor',
  created_at timestamptz not null default now()
);

create index on public.api_rate_limits (student_id, endpoint, created_at);

alter table public.api_rate_limits enable row level security;

-- Only service role (server) inserts — students cannot access this table
create policy "rate_limits: no direct access"
  on public.api_rate_limits for all
  using (false);

-- ──────────────────────────────────────────────
-- AUTO-UPDATE tutor_sessions.updated_at trigger
-- ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tutor_sessions_updated_at
  before update on public.tutor_sessions
  for each row execute procedure public.set_updated_at();

-- ──────────────────────────────────────────────
-- RPC: generate_invite_code
-- Creates (or returns existing) invite code for a student
-- ──────────────────────────────────────────────
create or replace function public.generate_invite_code(p_student_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_code     text;
  v_existing text;
  v_chars    text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i          int;
begin
  -- Return existing active code if available
  select code into v_existing
  from   public.invite_codes
  where  student_id = p_student_id
    and  not used
    and  expires_at > now()
  order  by created_at desc
  limit  1;

  if v_existing is not null then
    return v_existing;
  end if;

  -- Generate new unique code: XXXX-XXXX format
  loop
    v_code := '';
    for i in 1..4 loop
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    end loop;
    v_code := v_code || '-';
    for i in 1..4 loop
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    end loop;

    -- Check uniqueness
    exit when not exists (select 1 from public.invite_codes where code = v_code);
  end loop;

  insert into public.invite_codes (code, student_id)
  values (v_code, p_student_id);

  return v_code;
end;
$$;

-- ──────────────────────────────────────────────
-- RPC: claim_invite_code
-- Parent uses this to link a student
-- ──────────────────────────────────────────────
create or replace function public.claim_invite_code(p_code text, p_parent_profile_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_invite  public.invite_codes%rowtype;
begin
  select * into v_invite
  from   public.invite_codes
  where  code = upper(p_code)
    and  not used
    and  expires_at > now();

  if not found then
    return jsonb_build_object('success', false, 'error', 'Code not found or expired');
  end if;

  -- Create the parent-student link
  insert into public.parent_student_links (parent_profile_id, student_id)
  values (p_parent_profile_id, v_invite.student_id)
  on conflict (parent_profile_id, student_id) do nothing;

  -- Mark code as used
  update public.invite_codes
  set used    = true,
      used_by = p_parent_profile_id
  where id = v_invite.id;

  return jsonb_build_object('success', true, 'student_id', v_invite.student_id);
end;
$$;
