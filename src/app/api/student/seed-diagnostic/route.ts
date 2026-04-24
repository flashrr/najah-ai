import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// ── Skill mapping: diagnostic V1 labels → skill_definitions tags ──────────────
const SKILL_MAPPING: Record<string, string> = {
  'fractions':     'math_fractions_decimals',
  'equations':     'math_algebra_linear',
  'percentages':   'math_numbers_operations',
  'geometry':      'math_geometry_area_perimeter',
  'units':         'physics_measurement_units',
  "ohm's-law":     'physics_electricity_basics',
  'scalar-vector': 'physics_mechanics_forces',
  'vocabulary':    'eng_vocabulary_context',
  'grammar':       'eng_grammar_tenses',
  'comprehension': 'eng_reading_comprehension',
  'sequences':     'logic_sequences_patterns',
  'patterns':      'logic_sequences_patterns',
  'deduction':     'logic_deductive_reasoning',
  'variables':     'code_variables_types',
  'syntax':        'code_algorithms_basics',
}

// All skills tested per subject slug — used for backfill of existing rows
const ALL_DIAGNOSTIC_SKILLS: Record<string, string[]> = {
  math:    ['fractions', 'equations', 'percentages', 'geometry'],
  physics: ['units', "ohm's-law", 'scalar-vector'],
  english: ['vocabulary', 'grammar', 'comprehension'],
  logic:   ['sequences', 'patterns', 'deduction'],
  coding:  ['variables', 'syntax'],
}

// Diagnostic scores: correct → 65, wrong → 30
const SCORE_CORRECT = 65
const SCORE_WRONG   = 30

// ── POST /api/student/seed-diagnostic ────────────────────────────────────────
//
// Two modes:
//   1. Fresh diagnostic — client sends { skill_scores: Record<string,number> }
//      computed from the just-finished answers.
//   2. Backfill — client sends {} or no body; server derives skill_scores from
//      existing diagnostic_results rows using weak_topics + subject slug.
//
// Both modes are idempotent (GREATEST logic in DB function).

export async function POST(req: Request) {
  try {
    // ── Auth check ────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createServiceClient()

    // ── Resolve student ───────────────────────────────────────────────────────
    const { data: student } = await admin
      .from('students')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle()
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    let skillScores: Record<string, number> = {}
    try {
      const body = await req.json() as { skill_scores?: Record<string, number> }
      if (body?.skill_scores && typeof body.skill_scores === 'object') {
        skillScores = body.skill_scores
      }
    } catch {
      // Empty body — backfill mode
    }

    // ── Backfill mode: derive skill_scores from existing diagnostic rows ───────
    if (Object.keys(skillScores).length === 0) {
      const { data: diagRows } = await admin
        .from('diagnostic_results')
        .select('subject_id, weak_topics, subjects(slug)')
        .eq('student_id', student.id)

      type DiagRow = {
        subject_id: string
        weak_topics: string[] | null
        subjects: { slug: string } | null
      }

      for (const row of (diagRows as DiagRow[] | null) ?? []) {
        const slug       = row.subjects?.slug
        if (!slug) continue
        const allSkills  = ALL_DIAGNOSTIC_SKILLS[slug] ?? []
        const weakSet    = new Set(row.weak_topics ?? [])

        for (const oldTag of allSkills) {
          const newTag = SKILL_MAPPING[oldTag]
          if (!newTag) continue
          const score = weakSet.has(oldTag) ? SCORE_WRONG : SCORE_CORRECT
          // GREATEST — keep best score if tag appears in multiple subjects (shouldn't happen but safe)
          if (skillScores[newTag] === undefined || score > skillScores[newTag]) {
            skillScores[newTag] = score
          }
        }
      }
    }

    // ── Nothing to seed ───────────────────────────────────────────────────────
    if (Object.keys(skillScores).length === 0) {
      return NextResponse.json({ seeded: 0 })
    }

    // ── Call DB seed function (handles GREATEST + status update) ─────────────
    const { error: fnErr } = await admin.rpc('seed_skill_mastery_from_diagnostic', {
      p_student_id:  student.id,
      p_skill_scores: skillScores,
    })
    if (fnErr) {
      console.error('[seed-diagnostic] seed function error:', fnErr)
      return NextResponse.json({ error: 'Seeding failed' }, { status: 500 })
    }

    // ── Mark all this student's diagnostic rows as seeded ────────────────────
    const { error: markErr } = await admin
      .from('diagnostic_results')
      .update({ seeded_to_mastery: true })
      .eq('student_id', student.id)
    if (markErr) {
      // Non-fatal — seeding succeeded; idempotency means a re-run is harmless
      console.error('[seed-diagnostic] mark seeded error:', markErr)
    }

    return NextResponse.json({ seeded: Object.keys(skillScores).length })
  } catch (err) {
    console.error('[seed-diagnostic] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
