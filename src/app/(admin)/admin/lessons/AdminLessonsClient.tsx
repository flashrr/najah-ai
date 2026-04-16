'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Lesson, Subject, Week } from '@/lib/types'

interface Props {
  lessons:  (Lesson & { subject?: Subject; week?: { week_number: number; title: string } })[]
  subjects: Subject[]
  weeks:    Week[]
}

const EMPTY_FORM = {
  subject_id: '', week_id: '', title: '', objective: '',
  content_md: '', estimated_minutes: 15, difficulty: 'medium' as 'easy' | 'medium' | 'hard', order_index: 1,
}

export default function AdminLessonsClient({ lessons: initial, subjects, weeks }: Props) {
  const router                  = useRouter()
  const [lessons, setLessons]   = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [filterSubject, setFilterSubject] = useState('')

  function setField<K extends keyof typeof EMPTY_FORM>(k: K, v: typeof EMPTY_FORM[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(lesson: typeof lessons[0]) {
    setForm({
      subject_id:         lesson.subject_id,
      week_id:            lesson.week_id,
      title:              lesson.title,
      objective:          lesson.objective ?? '',
      content_md:         lesson.content_md,
      estimated_minutes:  lesson.estimated_minutes,
      difficulty:         lesson.difficulty,
      order_index:        lesson.order_index,
    })
    setEditingId(lesson.id)
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
    if (!form.subject_id || !form.week_id || !form.title) {
      setError('Subject, week, and title are required.')
      return
    }
    setSaving(true)
    setError('')

    const supabase = createClient()

    if (editingId) {
      // UPDATE
      const { data, error: dbErr } = await supabase
        .from('lessons')
        .update({ ...form })
        .eq('id', editingId)
        .select('*, subject:subjects(name, icon, color), week:weeks(week_number, title)')
        .single()

      if (dbErr) { setError(dbErr.message); setSaving(false); return }

      setLessons(prev => prev.map(l => l.id === editingId ? data : l))
    } else {
      // INSERT
      const { data, error: dbErr } = await supabase
        .from('lessons')
        .insert({ ...form })
        .select('*, subject:subjects(name, icon, color), week:weeks(week_number, title)')
        .single()

      if (dbErr) { setError(dbErr.message); setSaving(false); return }

      setLessons(prev => [...prev, data])
    }

    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditingId(null)
    setSaving(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lesson and all its exercises?')) return
    const supabase = createClient()
    await supabase.from('lessons').delete().eq('id', id)
    setLessons(prev => prev.filter(l => l.id !== id))
    if (editingId === id) cancelForm()
  }

  const filtered = filterSubject
    ? lessons.filter(l => l.subject_id === filterSubject)
    : lessons

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Lessons 📚</h1>
        <button className="btn-primary" onClick={showForm ? cancelForm : openCreate}>
          {showForm ? 'Cancel' : '+ Add lesson'}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterSubject('')}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${!filterSubject ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          All
        </button>
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => setFilterSubject(s.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${filterSubject === s.id ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={filterSubject === s.id ? { background: s.color } : {}}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSave} className="card space-y-4 border-2 border-brand-200">
          <h2 className="font-semibold">{editingId ? 'Edit lesson' : 'New lesson'}</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Subject *</label>
              <select className="input" value={form.subject_id} onChange={e => setField('subject_id', e.target.value)} required>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Week *</label>
              <select className="input" value={form.week_id} onChange={e => setField('week_id', e.target.value)} required>
                <option value="">Select week</option>
                {weeks.map(w => <option key={w.id} value={w.id}>Week {w.week_number} — {w.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Lesson title" required />
          </div>
          <div>
            <label className="label">Objective</label>
            <input className="input" value={form.objective} onChange={e => setField('objective', e.target.value)} placeholder="What students will learn" />
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
              <label className="label">Est. minutes</label>
              <input type="number" className="input" value={form.estimated_minutes} min={5} max={60}
                onChange={e => setField('estimated_minutes', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Order</label>
              <input type="number" className="input" value={form.order_index} min={1}
                onChange={e => setField('order_index', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="label">Content (Markdown)</label>
            <textarea
              className="input font-mono text-xs"
              rows={10}
              value={form.content_md}
              onChange={e => setField('content_md', e.target.value)}
              placeholder="## Introduction&#10;&#10;Write lesson content in Markdown..."
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update lesson' : 'Save lesson'}
            </button>
            <button type="button" className="btn-secondary" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Lessons table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Lesson</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Week</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Difficulty</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(l => (
              <tr key={l.id} className={`hover:bg-gray-50 ${editingId === l.id ? 'bg-brand-50' : ''}`}>
                <td className="px-4 py-3 font-medium">{l.title}</td>
                <td className="px-4 py-3 text-gray-500">
                  {l.subject?.icon} {l.subject?.name}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  Week {(l.week as { week_number: number })?.week_number}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge-${l.difficulty}`}>{l.difficulty}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => openEdit(l)}
                      className="text-brand-500 hover:text-brand-700 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">No lessons found.</div>
        )}
      </div>
    </div>
  )
}
