'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Exercise } from '@/lib/types'

interface LessonOption {
  id: string
  title: string
  subject?: { name: string; icon: string }
}

interface Props {
  exercises: (Exercise & { lesson?: { title: string; subject?: { name: string; icon: string } } })[]
  lessons:   LessonOption[]
}

const EMPTY_FORM = {
  lesson_id:      '',
  type:           'mcq' as 'mcq' | 'short_answer',
  question:       '',
  options:        ['', '', '', ''],
  correct_answer: '',
  explanation:    '',
  difficulty:     'medium' as 'easy' | 'medium' | 'hard',
  skill_tag:      '',
  order_index:    1,
}

export default function AdminExercisesClient({ exercises: initial, lessons }: Props) {
  const router = useRouter()
  const [exercises, setExercises]   = useState(initial)
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [filterLesson, setFilterLesson] = useState('')

  function setField<K extends keyof typeof EMPTY_FORM>(k: K, v: typeof EMPTY_FORM[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function setOption(i: number, v: string) {
    setForm(prev => {
      const opts = [...prev.options]
      opts[i] = v
      return { ...prev, options: opts }
    })
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(ex: typeof exercises[0]) {
    setForm({
      lesson_id:      ex.lesson_id,
      type:           ex.type as 'mcq' | 'short_answer',
      question:       ex.question,
      options:        ex.options && ex.options.length > 0
        ? [...ex.options, ...Array(Math.max(0, 4 - ex.options.length)).fill('')]
        : ['', '', '', ''],
      correct_answer: ex.correct_answer,
      explanation:    ex.explanation ?? '',
      difficulty:     ex.difficulty,
      skill_tag:      ex.skill_tag ?? '',
      order_index:    ex.order_index,
    })
    setEditingId(ex.id)
    setError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.lesson_id || !form.question || !form.correct_answer) {
      setError('Lesson, question, and correct answer are required.')
      return
    }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const payload = {
      ...form,
      options: form.type === 'mcq' ? form.options.filter(o => o.trim()) : null,
    }

    if (editingId) {
      // UPDATE
      const { data, error: dbErr } = await supabase
        .from('exercises')
        .update(payload)
        .eq('id', editingId)
        .select('*, lesson:lessons(title, subject:subjects(name, icon))')
        .single()

      if (dbErr) { setError(dbErr.message); setSaving(false); return }

      setExercises(prev => prev.map(ex => ex.id === editingId ? data : ex))
    } else {
      // INSERT
      const { data, error: dbErr } = await supabase
        .from('exercises')
        .insert(payload)
        .select('*, lesson:lessons(title, subject:subjects(name, icon))')
        .single()

      if (dbErr) { setError(dbErr.message); setSaving(false); return }

      setExercises(prev => [...prev, data])
    }

    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditingId(null)
    setSaving(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this exercise?')) return
    const supabase = createClient()
    await supabase.from('exercises').delete().eq('id', id)
    setExercises(prev => prev.filter(ex => ex.id !== id))
    if (editingId === id) cancelForm()
  }

  const filtered = filterLesson
    ? exercises.filter(ex => ex.lesson_id === filterLesson)
    : exercises

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Exercises ✏️</h1>
        <button className="btn-primary" onClick={showForm ? cancelForm : openCreate}>
          {showForm ? 'Cancel' : '+ Add exercise'}
        </button>
      </div>

      {/* Lesson filter */}
      <div className="flex gap-2 items-center flex-wrap">
        <label className="text-sm text-gray-500">Filter by lesson:</label>
        <select
          className="input w-auto text-sm"
          value={filterLesson}
          onChange={e => setFilterLesson(e.target.value)}
        >
          <option value="">All lessons</option>
          {lessons.map(l => (
            <option key={l.id} value={l.id}>
              {l.subject?.icon} {l.title}
            </option>
          ))}
        </select>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSave} className="card space-y-4 border-2 border-brand-200">
          <h2 className="font-semibold">{editingId ? 'Edit exercise' : 'New exercise'}</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Lesson *</label>
              <select className="input" value={form.lesson_id} onChange={e => setField('lesson_id', e.target.value)} required>
                <option value="">Select lesson</option>
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>{l.subject?.icon} {l.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setField('type', e.target.value as 'mcq' | 'short_answer')}>
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Question *</label>
            <textarea className="input" rows={3} value={form.question}
              onChange={e => setField('question', e.target.value)} placeholder="Write the question..." required />
          </div>

          {form.type === 'mcq' && (
            <div>
              <label className="label">Options (one per field)</label>
              {form.options.map((opt, i) => (
                <input
                  key={i}
                  className="input mb-2"
                  placeholder={`Option ${['A', 'B', 'C', 'D'][i]}`}
                  value={opt}
                  onChange={e => setOption(i, e.target.value)}
                />
              ))}
            </div>
          )}

          <div>
            <label className="label">Correct answer *</label>
            {form.type === 'mcq' ? (
              <select className="input" value={form.correct_answer} onChange={e => setField('correct_answer', e.target.value)} required>
                <option value="">Select correct option</option>
                {form.options.filter(o => o.trim()).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className="input" value={form.correct_answer}
                onChange={e => setField('correct_answer', e.target.value)} placeholder="Exact correct answer" required />
            )}
          </div>

          <div>
            <label className="label">Explanation (shown after answering)</label>
            <textarea className="input" rows={3} value={form.explanation}
              onChange={e => setField('explanation', e.target.value)} placeholder="Explain why this answer is correct..." />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={e => setField('difficulty', e.target.value as 'easy' | 'medium' | 'hard')}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="label">Skill tag</label>
              <input className="input" value={form.skill_tag} onChange={e => setField('skill_tag', e.target.value)} placeholder="e.g. fractions" />
            </div>
            <div>
              <label className="label">Order</label>
              <input type="number" className="input" value={form.order_index} min={1}
                onChange={e => setField('order_index', Number(e.target.value))} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update exercise' : 'Save exercise'}
            </button>
            <button type="button" className="btn-secondary" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}

      {/* Exercise list */}
      <div className="space-y-3">
        {filtered.map((ex, i) => (
          <div key={ex.id} className={`card flex items-start justify-between gap-4 ${editingId === ex.id ? 'ring-2 ring-brand-400' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs text-gray-400 font-mono">#{i + 1}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">{ex.type}</span>
                <span className={`badge-${ex.difficulty}`}>{ex.difficulty}</span>
                {ex.skill_tag && <span className="text-xs text-gray-400">{ex.skill_tag}</span>}
              </div>
              <p className="text-sm font-medium">{ex.question}</p>
              {ex.type === 'mcq' && ex.options && (
                <div className="flex gap-2 flex-wrap mt-1">
                  {ex.options.map((o: string) => (
                    <span key={o} className={`text-xs px-2 py-0.5 rounded ${o === ex.correct_answer ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>
                      {o === ex.correct_answer ? '✓ ' : ''}{o}
                    </span>
                  ))}
                </div>
              )}
              {ex.type === 'short_answer' && (
                <p className="text-xs text-green-700 mt-1">Answer: {ex.correct_answer}</p>
              )}
              <p className="text-xs text-gray-400 mt-1 truncate">{ex.explanation}</p>
              <p className="text-xs text-gray-300 mt-0.5">
                {ex.lesson?.subject?.icon} {ex.lesson?.title}
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => openEdit(ex)}
                className="text-brand-500 hover:text-brand-700 text-xs font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(ex.id)}
                className="text-red-500 hover:text-red-700 text-xs font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center text-gray-400 py-10">No exercises found.</div>
        )}
      </div>
    </div>
  )
}
