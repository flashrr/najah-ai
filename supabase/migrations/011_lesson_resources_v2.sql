-- ── Migration 011: Lesson Resources v2 ────────────────────────────────────────
-- Additive extension to lesson_resources. No existing data or behaviour changed.
-- Adds: video_role, is_validated, diagnostic band, pedagogical_position.
-- Expands: resource_type CHECK to include worked_example, retrieval_quiz, worksheet_pdf.
-- Backfills: video_role from existing resource_type values.

-- ── 1. Add new columns ────────────────────────────────────────────────────────

ALTER TABLE lesson_resources
  ADD COLUMN IF NOT EXISTS video_role text
    CHECK (video_role IN (
      'main_explanation',
      'reinforcement',
      'exercise_correction',
      'worked_example_video',
      'overview'
    )),

  ADD COLUMN IF NOT EXISTS is_validated boolean NOT NULL DEFAULT false,

  ADD COLUMN IF NOT EXISTS min_diagnostic_score int
    CHECK (min_diagnostic_score BETWEEN 0 AND 100),

  ADD COLUMN IF NOT EXISTS max_diagnostic_score int
    CHECK (max_diagnostic_score BETWEEN 0 AND 100),

  ADD COLUMN IF NOT EXISTS pedagogical_position text NOT NULL DEFAULT 'after_content'
    CHECK (pedagogical_position IN (
      'before_content',
      'alongside_content',
      'after_content',
      'after_exercises',
      'always_available'
    ));

-- ── 2. Expand resource_type CHECK constraint ──────────────────────────────────
-- Drop the auto-named inline constraint and replace with expanded set.

ALTER TABLE lesson_resources
  DROP CONSTRAINT IF EXISTS lesson_resources_resource_type_check;

ALTER TABLE lesson_resources
  ADD CONSTRAINT lesson_resources_resource_type_check
  CHECK (resource_type IN (
    'main_video',
    'supplemental_video',
    'summary',
    'exercise_set',
    'reference',
    'worked_example',
    'retrieval_quiz',
    'worksheet_pdf'
  ));

-- ── 3. Backfill video_role from existing resource_type values ─────────────────
-- Only updates rows where video_role IS NULL so manual edits are never overwritten.

UPDATE lesson_resources
SET video_role = 'main_explanation'
WHERE resource_type = 'main_video'
  AND video_role IS NULL;

UPDATE lesson_resources
SET video_role = 'reinforcement'
WHERE resource_type = 'supplemental_video'
  AND video_role IS NULL;

-- ── 4. Index for adaptive queries (used in Phase 2 display logic) ─────────────

CREATE INDEX IF NOT EXISTS lesson_resources_adaptive_idx
  ON lesson_resources(lesson_id, is_active, is_validated, quality_score);
