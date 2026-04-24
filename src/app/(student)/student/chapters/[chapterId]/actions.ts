'use server'

import { createServiceClient } from '@/lib/supabase/server'

export async function saveChapterAssessment(
  studentId: string,
  chapterId: string,
  type: 'diagnostic' | 'evaluation',
  score: number,
  totalQuestions: number,
  correctCount: number,
) {
  const admin = createServiceClient()
  const { error } = await admin
    .from('chapter_assessments')
    .upsert(
      {
        student_id:      studentId,
        chapter_id:      chapterId,
        type,
        score,
        total_questions: totalQuestions,
        correct_count:   correctCount,
        completed_at:    new Date().toISOString(),
      },
      { onConflict: 'student_id,chapter_id,type' },
    )

  if (error) {
    console.error('[saveChapterAssessment] failed:', error.code, error.message)
    throw new Error('Failed to save assessment')
  }
}
