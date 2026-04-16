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
  title: string
  objective: string | null
  content_md: string
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
