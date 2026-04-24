export type Role = 'student' | 'parent' | 'admin'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type LessonStatus = 'not_started' | 'in_progress' | 'completed'
export type ExerciseType = 'mcq' | 'short_answer' | 'step_by_step'

export interface Profile {
  id: string
  full_name: string
  role: Role
  created_at: string
}

export interface Student {
  id: string
  profile_id: string
  level: string
  school_name: string | null
  points: number
  streak_days: number
  last_active: string | null
  created_at: string
}

export interface Subject {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  color: string
}

export interface Week {
  id: string
  week_number: number
  title: string
  objective: string | null
}

export interface Lesson {
  id: string
  subject_id: string
  week_id: string
  chapter_id: string | null
  title: string
  objective: string | null
  content_md: string
  guided_example_md: string | null
  prerequisites: string | null
  estimated_minutes: number
  difficulty: Difficulty
  order_index: number
  created_at: string
  // joined
  subject?: Subject
  week?: Week
}

export interface Exercise {
  id: string
  lesson_id: string
  type: ExerciseType
  question: string
  options: string[] | null
  correct_answer: string
  explanation: string
  difficulty: Difficulty
  skill_tag: string | null
  order_index: number
}

export interface Attempt {
  id: string
  student_id: string
  exercise_id: string
  answer: string
  is_correct: boolean
  score: number
  created_at: string
}

export interface LessonProgress {
  id: string
  student_id: string
  lesson_id: string
  status: LessonStatus
  score: number | null
  completed_at: string | null
  created_at: string
}

export interface DiagnosticResult {
  id: string
  student_id: string
  subject_id: string
  score: number
  weak_topics: string[]
  created_at: string
  // joined
  subject?: Subject
}

export interface AiTutorLog {
  id: string
  student_id: string
  subject_id: string | null
  lesson_id: string | null
  user_question: string
  ai_response: string
  created_at: string
}

export interface ParentReport {
  id: string
  student_id: string
  week_id: string
  summary: string | null
  weak_areas: string[]
  recommendations: string[]
  lessons_done: number
  avg_score: number
  time_minutes: number
  created_at: string
  // joined
  week?: Week
}

export interface ParentStudentLink {
  id: string
  parent_profile_id: string
  student_id: string
  relationship: string
  created_at: string
  // joined
  student?: Student & { profiles?: Profile }
}

// ── Schedule types ────────────────────────────────────────────────────────────

export interface SchoolTimetableEntry {
  id:          string
  student_id:  string
  day_of_week: number   // 0=Sun, 1=Mon … 6=Sat
  start_time:  string   // HH:MM (postgres time, sliced to HH:MM on read)
  end_time:    string
  label:       string | null
  created_at:  string
}

export interface FreeTimeSlot {
  id:          string
  student_id:  string
  day_of_week: number
  start_time:  string
  end_time:    string
  label:       string | null
  created_at:  string
}

// Lightweight shape used by the schedule editor (no id / student_id needed)
export interface TimeBlock {
  id?:         string   // undefined = new (not yet persisted)
  day_of_week: number
  start_time:  string   // HH:MM
  end_time:    string   // HH:MM
  label:       string
}

// ── Lesson Resource types ─────────────────────────────────────────────────────

export type ResourceType =
  | 'main_video'
  | 'supplemental_video'
  | 'summary'
  | 'exercise_set'
  | 'reference'
  | 'worked_example'     // text-based step-by-step solved problem
  | 'retrieval_quiz'     // 2–4 quick recall questions (markdown)
  | 'worksheet_pdf'      // downloadable PDF worksheet (Phase 3)

/** Fine-grained pedagogical role — applies to video resource_types only */
export type VideoRole =
  | 'main_explanation'      // primary teaching video for this lesson
  | 'reinforcement'         // alternate / deeper explanation
  | 'exercise_correction'   // walkthrough of corrected exercises
  | 'worked_example_video'  // video of a solved worked example
  | 'overview'              // subject/unit overview, not lesson-specific

/** Where in the lesson flow this resource is rendered */
export type PedagogicalPosition =
  | 'before_content'    // shown before lesson text (struggling students)
  | 'alongside_content' // shown inline during reading
  | 'after_content'     // shown after lesson text, before exercises  (default)
  | 'after_exercises'   // shown after exercises (correction, reinforcement)
  | 'always_available'  // accessible regardless of position

export interface LessonResource {
  id:                    string
  lesson_id:             string | null   // null = subject-level resource
  subject_id:            string
  resource_type:         ResourceType
  title:                 string
  description:           string | null
  url:                   string | null
  youtube_id:            string | null
  thumbnail_url:         string | null
  duration_seconds:      number | null
  content_md:            string | null
  language:              string
  source_country:        string | null
  source_name:           string | null
  teacher_name:          string | null
  curriculum_tag:        string | null
  difficulty:            Difficulty | null
  skill_tags:            string[] | null
  quality_score:         number | null
  is_active:             boolean
  order_index:           number
  target_level:          string
  show_on_struggle:      boolean
  show_on_mastery:       boolean
  // ── v2 fields (Migration 011) ────────────────────────────────────────────
  video_role:            VideoRole | null
  is_validated:          boolean
  min_diagnostic_score:  number | null
  max_diagnostic_score:  number | null
  pedagogical_position:  PedagogicalPosition
  // ────────────────────────────────────────────────────────────────────────
  created_at:            string
  updated_at:            string
}

// API request/response types
export interface AiTutorRequest {
  student_id: string
  subject: string
  lesson_id?: string
  question: string
  exercise_context?: string
  conversation_history?: { role: 'user' | 'assistant'; content: string }[]
}

export interface AiTutorResponse {
  guided_response: string
  suggested_next_step: string
  confidence: 'low' | 'medium' | 'high'
}
