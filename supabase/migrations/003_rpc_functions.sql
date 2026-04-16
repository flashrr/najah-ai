-- ============================================================
-- Najah AI — RPC Helper Functions
-- v1.1 — fixed update_streak logic (was unreachable CASE branch)
-- ============================================================

-- Increment student points safely (avoids race conditions)
create or replace function public.increment_points(student_id uuid, amount integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.students
  set points = points + amount
  where id = student_id;
end;
$$;

-- Update streak correctly:
--   null            → start at 1
--   = yesterday     → increment
--   < yesterday     → reset to 1
--   = today         → no change (idempotent)
create or replace function public.update_streak(p_student_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_last_active date;
  v_today       date := current_date;
begin
  select last_active
  into   v_last_active
  from   public.students
  where  id = p_student_id;

  if v_last_active is null then
    update public.students
    set streak_days = 1, last_active = v_today
    where id = p_student_id;

  elsif v_last_active = v_today then
    -- already counted today — do nothing
    null;

  elsif v_last_active = v_today - 1 then
    update public.students
    set streak_days = streak_days + 1, last_active = v_today
    where id = p_student_id;

  else
    -- gap of 2+ days → reset
    update public.students
    set streak_days = 1, last_active = v_today
    where id = p_student_id;
  end if;
end;
$$;
