-- ── Lesson Resources ──────────────────────────────────────────────────────────
-- Curated videos, summaries, and references attached to lessons or subjects.
-- lesson_id = NULL means the resource applies to the whole subject (no lesson yet).

CREATE TABLE lesson_resources (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id        uuid REFERENCES lessons(id) ON DELETE CASCADE,          -- nullable = subject-level
  subject_id       uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  resource_type    text NOT NULL CHECK (resource_type IN (
                     'main_video', 'supplemental_video', 'summary', 'exercise_set', 'reference'
                   )),
  title            text NOT NULL,
  description      text,
  url              text,
  youtube_id       text,
  thumbnail_url    text,
  duration_seconds int,
  content_md       text,
  language         text NOT NULL DEFAULT 'en',
  source_country   text,
  source_name      text,
  teacher_name     text,
  curriculum_tag   text,
  difficulty       text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  skill_tags       text[],
  quality_score    int CHECK (quality_score BETWEEN 1 AND 5),
  is_active        boolean NOT NULL DEFAULT true,
  order_index      int NOT NULL DEFAULT 0,
  target_level     text NOT NULL DEFAULT '3eme',
  show_on_struggle boolean NOT NULL DEFAULT false,
  show_on_mastery  boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX lesson_resources_lesson_id_idx  ON lesson_resources(lesson_id)
  WHERE lesson_id IS NOT NULL;
CREATE INDEX lesson_resources_subject_id_idx ON lesson_resources(subject_id);
CREATE INDEX lesson_resources_active_idx     ON lesson_resources(subject_id, is_active, order_index);

-- RLS
ALTER TABLE lesson_resources ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active resources
CREATE POLICY "authenticated users read active resources"
  ON lesson_resources FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can create / update / delete
CREATE POLICY "admins manage resources"
  ON lesson_resources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
