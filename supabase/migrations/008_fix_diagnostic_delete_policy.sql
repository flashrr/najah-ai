-- ============================================================
-- Migration 008: Add DELETE policy for diagnostic_results
-- Applied: 2026-04-18
-- ============================================================
-- Root cause: diagnostic retake flow called .delete() on
-- diagnostic_results but no DELETE RLS policy existed for students.
-- The call was silently blocked, leaving orphaned rows on retake.
-- ============================================================

CREATE POLICY "diagnostics: student deletes own"
  ON public.diagnostic_results FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = diagnostic_results.student_id
        AND s.profile_id = auth.uid()
    )
  );
