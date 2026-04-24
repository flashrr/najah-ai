'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ResourceType, VideoRole, PedagogicalPosition } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ResourceRow {
  id:                   string
  lesson_id:            string | null
  subject_id:           string
  resource_type:        ResourceType
  title:                string
  description:          string | null
  url:                  string | null
  youtube_id:           string | null
  content_md:           string | null
  language:             string
  difficulty:           string | null
  quality_score:        number | null
  is_active:            boolean
  order_index:          number
  // v2 fields
  video_role:           VideoRole | null
  is_validated:         boolean
  pedagogical_position: PedagogicalPosition
  min_diagnostic_score: number | null
  max_diagnostic_score: number | null
  subject?:             { name: string; icon: string | null } | null
  lesson?:              { title: string } | null
}

interface SubjectOption { id: string; name: string; icon: string | null; slug: string }
interface LessonOption  { id: string; title: string; subject_id: string }

interface Props {
  resources: ResourceRow[]
  subjects:  SubjectOption[]
  lessons:   LessonOption[]
}

const RESOURCE_TYPES: ResourceType[] = [
  'main_video', 'supplemental_video', 'summary', 'exercise_set',
  'worked_example', 'retrieval_quiz', 'reference', 'worksheet_pdf',
]

const TYPE_LABELS: Record<ResourceType, string> = {
  main_video:         '🎬 Main video',
  supplemental_video: '🎥 Supplemental video',
  summary:            '📋 Summary',
  exercise_set:       '✏️ Exercise set',
  worked_example:     '🔍 Worked example',
  retrieval_quiz:     '❓ Retrieval quiz',
  reference:          '📖 Reference',
  worksheet_pdf:      '📄 Worksheet PDF',
}

const VIDEO_TYPES = new Set<ResourceType>(['main_video', 'supplemental_video'])

const VIDEO_ROLE_LABELS: Record<VideoRole, string> = {
  main_explanation:     '🎯 Main explanation',
  reinforcement:        '🔄 Reinforcement',
  exercise_correction:  '✅ Exercise correction',
  worked_example_video: '🔍 Worked example (video)',
  overview:             '🗺️ Overview',
}

const POSITION_LABELS: Record<PedagogicalPosition, string> = {
  before_content:    '⬆️ Before lesson content',
  alongside_content: '↕️ Alongside content',
  after_content:     '⬇️ After content (default)',
  after_exercises:   '🔚 After exercises',
  always_available:  '📌 Always available',
}

const TYPE_ICON: Record<ResourceType, string> = {
  main_video:         '🎬',
  supplemental_video: '🎥',
  summary:            '📋',
  exercise_set:       '✏️',
  worked_example:     '🔍',
  retrieval_quiz:     '❓',
  reference:          '📖',
  worksheet_pdf:      '📄',
}

// ── Blank form state ───────────────────────────────────────────────────────────

function blankForm(subjectId = '') {
  return {
    lesson_id:            '',
    subject_id:           subjectId,
    resource_type:        'summary' as ResourceType,
    title:                '',
    description:          '',
    url:                  '',
    youtube_id:           '',
    content_md:           '',
    language:             'fr',
    difficulty:           '',
    quality_score:        '4',
    is_active:            true,
    order_index:          '0',
    // v2 fields
    video_role:           '' as VideoRole | '',
    is_validated:         false,
    pedagogical_position: 'after_content' as PedagogicalPosition,
    min_diagnostic_score: '',
    max_diagnostic_score: '',
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminResourcesClient({ resources: initial, subjects, lessons }: Props) {
  const [resources, setResources] = useState<ResourceRow[]>(initial)
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<ResourceRow | null>(null)
  const [form,      setForm]      = useState(blankForm())
  const [error,     setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const supabase = createClient()

  // ── Filter UI state ──────────────────────────────────────────────────────────
  const [filterSubject, setFilterSubject] = useState('')
  const [filterActive,  setFilterActive]  = useState<'all' | 'active' | 'inactive'>('all')

  const filtered = resources.filter(r => {
    if (filterSubject && r.subject_id !== filterSubject) return false
    if (filterActive === 'active'   && !r.is_active)  return false
    if (filterActive === 'inactive' &&  r.is_active)  return false
    return true
  })

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null)
    setForm(blankForm())
    setError(null)
    setShowForm(true)
  }

  function openEdit(r: ResourceRow) {
    setEditing(r)
    setForm({
      lesson_id:            r.lesson_id            ?? '',
      subject_id:           r.subject_id,
      resource_type:        r.resource_type,
      title:                r.title,
      description:          r.description          ?? '',
      url:                  r.url                  ?? '',
      youtube_id:           r.youtube_id           ?? '',
      content_md:           r.content_md           ?? '',
      language:             r.language,
      difficulty:           r.difficulty           ?? '',
      quality_score:        String(r.quality_score ?? 4),
      is_active:            r.is_active,
      order_index:          String(r.order_index),
      // v2 fields
      video_role:           r.video_role           ?? '',
      is_validated:         r.is_validated         ?? false,
      pedagogical_position: r.pedagogical_position ?? 'after_content',
      min_diagnostic_score: r.min_diagnostic_score != null ? String(r.min_diagnostic_score) : '',
      max_diagnostic_score: r.max_diagnostic_score != null ? String(r.max_diagnostic_score) : '',
    })
    setError(null)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditing(null)
    setError(null)
  }

  // ── Save (create or update) ───────────────────────────────────────────────────

  function handleSave() {
    if (!form.title.trim())      { setError('Title is required.');      return }
    if (!form.subject_id)        { setError('Subject is required.');    return }
    if (!form.resource_type)     { setError('Type is required.');       return }

    const payload = {
      lesson_id:            form.lesson_id            || null,
      subject_id:           form.subject_id,
      resource_type:        form.resource_type,
      title:                form.title.trim(),
      description:          form.description.trim()          || null,
      url:                  form.url.trim()                  || null,
      youtube_id:           form.youtube_id.trim()           || null,
      content_md:           form.content_md.trim()           || null,
      language:             form.language                    || 'fr',
      difficulty:           form.difficulty                  || null,
      quality_score:        form.quality_score ? parseInt(form.quality_score) : null,
      is_active:            form.is_active,
      order_index:          parseInt(form.order_index) || 0,
      // v2 fields
      video_role:           form.video_role                  || null,
      is_validated:         form.is_validated,
      pedagogical_position: form.pedagogical_position        || 'after_content',
      min_diagnostic_score: form.min_diagnostic_score !== '' ? parseInt(form.min_diagnostic_score as string) : null,
      max_diagnostic_score: form.max_diagnostic_score !== '' ? parseInt(form.max_diagnostic_score as string) : null,
    }

    startTransition(async () => {
      if (editing) {
        const { data, error: err } = await supabase
          .from('lesson_resources')
          .update(payload)
          .eq('id', editing.id)
          .select('*, subject:subjects(name, icon), lesson:lessons(title)')
          .single()

        if (err) { setError(err.message); return }
        setResources(prev => prev.map(r => r.id === editing.id ? (data as ResourceRow) : r))
      } else {
        const { data, error: err } = await supabase
          .from('lesson_resources')
          .insert(payload)
          .select('*, subject:subjects(name, icon), lesson:lessons(title)')
          .single()

        if (err) { setError(err.message); return }
        setResources(prev => [...prev, data as ResourceRow])
      }

      cancelForm()
    })
  }

  // ── Toggle active ─────────────────────────────────────────────────────────────

  function toggleActive(r: ResourceRow) {
    startTransition(async () => {
      const { error: err } = await supabase
        .from('lesson_resources')
        .update({ is_active: !r.is_active })
        .eq('id', r.id)

      if (err) { setError(err.message); return }
      setResources(prev => prev.map(x => x.id === r.id ? { ...x, is_active: !x.is_active } : x))
    })
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  function handleDelete(r: ResourceRow) {
    if (!window.confirm(`Delete "${r.title}"? This cannot be undone.`)) return

    startTransition(async () => {
      const { error: err } = await supabase
        .from('lesson_resources')
        .delete()
        .eq('id', r.id)

      if (err) { setError(err.message); return }
      setResources(prev => prev.filter(x => x.id !== r.id))
    })
  }

  // ── Filtered lessons for subject dropdown ─────────────────────────────────────

  const subjectLessons = form.subject_id
    ? lessons.filter(l => l.subject_id === form.subject_id)
    : []

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Resources 📹</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Curated videos, summaries, and references for each lesson.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Add resource
        </button>
      </div>

      {/* Global error */}
      {error && !showForm && (
        <div className="card border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="input text-sm py-1.5 min-w-[160px]"
        >
          <option value="">All subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>

        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {(['all', 'active', 'inactive'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilterActive(v)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filterActive === v ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <span className="text-sm text-gray-400 self-center">{filtered.length} resource{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Create / Edit Form ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="card border-2 border-brand-200 space-y-4">
          <h2 className="font-semibold text-gray-800">{editing ? 'Edit resource' : 'Add resource'}</h2>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Subject */}
            <div>
              <label className="label">Subject *</label>
              <select
                className="input"
                value={form.subject_id}
                onChange={e => setForm(f => ({ ...f, subject_id: e.target.value, lesson_id: '' }))}
              >
                <option value="">Select subject…</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>

            {/* Lesson (optional) */}
            <div>
              <label className="label">Lesson (optional)</label>
              <select
                className="input"
                value={form.lesson_id}
                onChange={e => setForm(f => ({ ...f, lesson_id: e.target.value }))}
                disabled={!form.subject_id}
              >
                <option value="">Subject-level (no lesson)</option>
                {subjectLessons.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="label">Resource type *</label>
              <select
                className="input"
                value={form.resource_type}
                onChange={e => setForm(f => ({ ...f, resource_type: e.target.value as ResourceType }))}
              >
                {RESOURCE_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="label">Language</label>
              <select
                className="input"
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            {/* Title */}
            <div className="sm:col-span-2">
              <label className="label">Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Fractions — Quick Reference"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <input
                className="input"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description for students"
              />
            </div>

            {/* YouTube ID */}
            <div>
              <label className="label">YouTube ID</label>
              <input
                className="input"
                value={form.youtube_id}
                onChange={e => setForm(f => ({ ...f, youtube_id: e.target.value }))}
                placeholder="e.g. dQw4w9WgXcQ"
              />
            </div>

            {/* URL */}
            <div>
              <label className="label">URL (external link)</label>
              <input
                className="input"
                type="url"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://…"
              />
            </div>

            {/* Quality score */}
            <div>
              <label className="label">Quality score (1–5)</label>
              <select
                className="input"
                value={form.quality_score}
                onChange={e => setForm(f => ({ ...f, quality_score: e.target.value }))}
              >
                <option value="">—</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {'★'.repeat(n)}</option>)}
              </select>
            </div>

            {/* Order index */}
            <div>
              <label className="label">Order index</label>
              <input
                className="input"
                type="number"
                min="0"
                value={form.order_index}
                onChange={e => setForm(f => ({ ...f, order_index: e.target.value }))}
              />
            </div>

            {/* content_md */}
            <div className="sm:col-span-2">
              <label className="label">Summary / content (Markdown)</label>
              <textarea
                className="input font-mono text-xs"
                rows={8}
                value={form.content_md}
                onChange={e => setForm(f => ({ ...f, content_md: e.target.value }))}
                placeholder="## Title&#10;&#10;Write markdown here…"
              />
            </div>

            {/* is_active */}
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                id="is-active"
                type="checkbox"
                className="w-4 h-4"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              />
              <label htmlFor="is-active" className="text-sm text-gray-700">
                Active (visible to students)
              </label>
            </div>

            {/* ── v2 fields ──────────────────────────────────────────────── */}
            <div className="sm:col-span-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Pedagogical metadata (v2)
              </p>
            </div>

            {/* Video role — only for video resource types */}
            {VIDEO_TYPES.has(form.resource_type) && (
              <div>
                <label className="label">Video role</label>
                <select
                  className="input"
                  value={form.video_role}
                  onChange={e => setForm(f => ({ ...f, video_role: e.target.value as VideoRole | '' }))}
                >
                  <option value="">— none selected —</option>
                  {(Object.entries(VIDEO_ROLE_LABELS) as [VideoRole, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Pedagogical position */}
            <div>
              <label className="label">Lesson position</label>
              <select
                className="input"
                value={form.pedagogical_position}
                onChange={e => setForm(f => ({ ...f, pedagogical_position: e.target.value as PedagogicalPosition }))}
              >
                {(Object.entries(POSITION_LABELS) as [PedagogicalPosition, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Diagnostic band */}
            <div>
              <label className="label">Min diagnostic score (0–100)</label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                placeholder="Leave blank for all levels"
                value={form.min_diagnostic_score}
                onChange={e => setForm(f => ({ ...f, min_diagnostic_score: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Max diagnostic score (0–100)</label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                placeholder="Leave blank for all levels"
                value={form.max_diagnostic_score}
                onChange={e => setForm(f => ({ ...f, max_diagnostic_score: e.target.value }))}
              />
            </div>

            {/* is_validated */}
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                id="is-validated"
                type="checkbox"
                className="w-4 h-4"
                checked={form.is_validated}
                onChange={e => setForm(f => ({ ...f, is_validated: e.target.checked }))}
              />
              <label htmlFor="is-validated" className="text-sm text-gray-700">
                <span className="font-medium">Editorially validated</span>
                <span className="text-gray-400 ml-1">— safe to show students</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? 'Saving…' : editing ? 'Save changes' : 'Create resource'}
            </button>
            <button className="btn-secondary" onClick={cancelForm} disabled={isPending}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Resource list ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">
          <div className="text-3xl mb-2">📭</div>
          <p>No resources match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className={`card flex items-start gap-3 ${!r.is_active ? 'opacity-60' : ''}`}>

              {/* Type badge */}
              <span className="text-lg flex-shrink-0 mt-0.5">
                {TYPE_ICON[r.resource_type] ?? '📄'}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-gray-900 truncate">{r.title}</p>
                  {r.is_validated && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5 flex-shrink-0">
                      ✓ validated
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500">
                  <span>{r.subject?.icon} {r.subject?.name}</span>
                  {r.lesson && <span>→ {r.lesson.title}</span>}
                  {!r.lesson_id && <span className="text-orange-500">subject-level</span>}
                  <span className="uppercase">{r.language}</span>
                  {r.video_role && (
                    <span className="text-brand-600 font-medium">{r.video_role.replace(/_/g, ' ')}</span>
                  )}
                  {r.quality_score && <span>{'★'.repeat(r.quality_score)}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(r)}
                  disabled={isPending}
                  title={r.is_active ? 'Deactivate' : 'Activate'}
                  className={`text-xs px-2 py-1 rounded font-medium border transition-colors ${
                    r.is_active
                      ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {r.is_active ? 'Live' : 'Off'}
                </button>
                <button
                  onClick={() => openEdit(r)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(r)}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
