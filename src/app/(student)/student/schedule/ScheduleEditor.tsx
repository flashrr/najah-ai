'use client'

import { useState, useTransition } from 'react'
import { saveSchedule } from './actions'
import type { TimeBlock } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

// 0=Sun, 1=Mon … 6=Sat — Morocco school week is Mon–Sat
const DAYS: { dow: number; short: string; long: string }[] = [
  { dow: 1, short: 'Mon', long: 'Monday'    },
  { dow: 2, short: 'Tue', long: 'Tuesday'   },
  { dow: 3, short: 'Wed', long: 'Wednesday' },
  { dow: 4, short: 'Thu', long: 'Thursday'  },
  { dow: 5, short: 'Fri', long: 'Friday'    },
  { dow: 6, short: 'Sat', long: 'Saturday'  },
  { dow: 0, short: 'Sun', long: 'Sunday'    },
]

const SESSION_LENGTHS = [
  { value: 20,  label: '20 minutes'  },
  { value: 30,  label: '30 minutes'  },
  { value: 45,  label: '45 minutes'  },
  { value: 60,  label: '1 hour'      },
  { value: 90,  label: '1.5 hours'   },
  { value: 120, label: '2 hours'     },
]

// Generate time options in 30-min increments 06:00–22:00
function buildTimeOptions(): string[] {
  const opts: string[] = []
  for (let h = 6; h <= 22; h++) {
    opts.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 22) opts.push(`${String(h).padStart(2, '0')}:30`)
  }
  return opts
}
const TIME_OPTIONS = buildTimeOptions()

// ── Types ─────────────────────────────────────────────────────────────────────

type AddingState = { start: string; end: string; label: string } | null

// ── Props ─────────────────────────────────────────────────────────────────────

interface ScheduleEditorProps {
  studentId:          string
  initialSchoolBlocks: TimeBlock[]
  initialFreeSlots:    TimeBlock[]
  targetStudyMinutes:  number
  loadError:           string | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScheduleEditor({
  studentId,
  initialSchoolBlocks,
  initialFreeSlots,
  targetStudyMinutes: initialTarget,
  loadError,
}: ScheduleEditorProps) {
  // ── State ───────────────────────────────────────────────────────────────
  const [tab,         setTab]   = useState<'school' | 'free'>('school')
  const [activeDay,   setActiveDay]   = useState<number>(1)  // Monday

  const [schoolBlocks, setSchoolBlocks] = useState<TimeBlock[]>(initialSchoolBlocks)
  const [freeSlots,    setFreeSlots]    = useState<TimeBlock[]>(initialFreeSlots)

  const [targetStudyMinutes, setTargetStudyMinutes] = useState(initialTarget)

  // Adding state: null = form hidden, object = form visible
  const [adding,  setAdding]  = useState<AddingState>(null)
  const [addErr,  setAddErr]  = useState('')

  const [saveError,   setSaveError]   = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isPending,   startTransition] = useTransition()

  // ── Derived helpers ──────────────────────────────────────────────────────
  const blocks     = tab === 'school' ? schoolBlocks : freeSlots
  const setBlocks  = tab === 'school' ? setSchoolBlocks : setFreeSlots

  const dayBlocks  = blocks.filter(b => b.day_of_week === activeDay)
  const dayName    = DAYS.find(d => d.dow === activeDay)?.long ?? 'Day'

  // ── Block actions ────────────────────────────────────────────────────────
  function removeBlock(idx: number) {
    // idx within dayBlocks; find global idx
    let count = 0
    const newBlocks = blocks.filter(b => {
      if (b.day_of_week !== activeDay) return true
      const keep = count !== idx
      count++
      return keep
    })
    setBlocks(newBlocks)
    setSaveSuccess(false)
  }

  function openAddForm() {
    setAdding({ start: '08:00', end: '13:00', label: '' })
    setAddErr('')
  }

  function confirmAdd() {
    if (!adding) return
    if (adding.end <= adding.start) {
      setAddErr('End time must be after start time.')
      return
    }
    // Check for overlap with existing blocks on this day
    const overlap = dayBlocks.some(
      b => adding.start < b.end_time && adding.end > b.start_time
    )
    if (overlap) {
      setAddErr('This time range overlaps with an existing block.')
      return
    }
    const newBlock: TimeBlock = {
      day_of_week: activeDay,
      start_time:  adding.start,
      end_time:    adding.end,
      label:       adding.label.trim(),
    }
    setBlocks(prev => [...prev, newBlock].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
      return a.start_time.localeCompare(b.start_time)
    }))
    setAdding(null)
    setAddErr('')
    setSaveSuccess(false)
  }

  // ── Save handler ─────────────────────────────────────────────────────────
  function handleSave() {
    setSaveError('')
    setSaveSuccess(false)
    startTransition(async () => {
      const result = await saveSchedule(studentId, {
        schoolBlocks:       schoolBlocks.map(b => ({
          day_of_week: b.day_of_week,
          start_time:  b.start_time,
          end_time:    b.end_time,
          label:       b.label || null,
        })),
        freeSlots:          freeSlots.map(s => ({
          day_of_week: s.day_of_week,
          start_time:  s.start_time,
          end_time:    s.end_time,
          label:       s.label || null,
        })),
        targetStudyMinutes,
      })
      if (result.error) {
        setSaveError(result.error)
      } else {
        setSaveSuccess(true)
      }
    })
  }

  // ── Count helpers (for summary badges) ──────────────────────────────────
  const schoolCount = schoolBlocks.length
  const freeCount   = freeSlots.length

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Schedule 🗓️</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set your school hours and free study windows so your weekly plan fits your real life.
        </p>
      </div>

      {/* Load error */}
      {loadError && (
        <div className="card border-l-4 border-yellow-400 bg-yellow-50 py-3">
          <p className="text-sm text-yellow-700">⚠️ {loadError}</p>
        </div>
      )}

      {/* ── Tab selector ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { setTab('school'); setAdding(null); setAddErr('') }}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
            tab === 'school'
              ? 'bg-brand-600 border-brand-600 text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
          }`}
        >
          <span>🏫</span>
          <span>School hours</span>
          {schoolCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === 'school' ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
            }`}>
              {schoolCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setTab('free'); setAdding(null); setAddErr('') }}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
            tab === 'free'
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
          }`}
        >
          <span>📖</span>
          <span>Study windows</span>
          {freeCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === 'free' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
            }`}>
              {freeCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab description */}
      <div className={`text-xs px-3 py-2 rounded-lg ${
        tab === 'school' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
      }`}>
        {tab === 'school'
          ? '🏫 Mark when you are at school — the planner will not schedule lessons during these hours.'
          : '📖 Mark when you are free to study — the planner will schedule your lessons in these windows.'}
      </div>

      {/* ── Day selector ──────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.map(d => {
          const count = blocks.filter(b => b.day_of_week === d.dow).length
          const active = activeDay === d.dow
          return (
            <button
              key={d.dow}
              onClick={() => { setActiveDay(d.dow); setAdding(null); setAddErr('') }}
              className={`relative flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                active
                  ? tab === 'school'
                    ? 'bg-brand-600 text-white'
                    : 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              <span>{d.short}</span>
              {count > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  active ? 'bg-white text-brand-600' : 'bg-brand-500 text-white'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Time blocks for selected day ───────────────────────────────────── */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">
            {tab === 'school' ? '🏫' : '📖'} {dayName}
          </h2>
          <span className="text-xs text-gray-400">
            {dayBlocks.length === 0
              ? 'No blocks yet'
              : `${dayBlocks.length} block${dayBlocks.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Existing blocks */}
        {dayBlocks.length === 0 && !adding && (
          <p className="text-sm text-gray-400 py-2 text-center">
            {tab === 'school'
              ? 'No school hours set for this day.'
              : 'No study windows set for this day.'}
          </p>
        )}

        {dayBlocks.map((b, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm ${
              tab === 'school'
                ? 'bg-orange-50 border-orange-100'
                : 'bg-green-50 border-green-100'
            }`}
          >
            <span className="font-mono font-medium text-gray-700 flex-shrink-0">
              {b.start_time} – {b.end_time}
            </span>
            {b.label && (
              <span className="text-gray-500 flex-1 truncate">{b.label}</span>
            )}
            {!b.label && <span className="flex-1" />}
            <button
              type="button"
              onClick={() => removeBlock(idx)}
              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
              aria-label="Remove block"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add form */}
        {adding && (
          <div className={`space-y-3 p-3 rounded-xl border ${
            tab === 'school' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Start time</label>
                <select
                  value={adding.start}
                  onChange={e => setAdding(a => a ? { ...a, start: e.target.value } : a)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-400"
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">End time</label>
                <select
                  value={adding.end}
                  onChange={e => setAdding(a => a ? { ...a, end: e.target.value } : a)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-400"
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Label (optional)</label>
              <input
                type="text"
                value={adding.label}
                onChange={e => setAdding(a => a ? { ...a, label: e.target.value } : a)}
                placeholder={tab === 'school' ? 'e.g. Morning classes' : 'e.g. After school'}
                maxLength={40}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-400"
              />
            </div>
            {addErr && <p className="text-xs text-red-500">{addErr}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmAdd}
                className="btn-primary text-sm flex-1"
              >
                Add block
              </button>
              <button
                type="button"
                onClick={() => { setAdding(null); setAddErr('') }}
                className="btn-secondary text-sm px-4"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add button */}
        {!adding && (
          <button
            type="button"
            onClick={openAddForm}
            className={`w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors ${
              tab === 'school'
                ? 'border-orange-200 text-orange-500 hover:border-orange-400 hover:bg-orange-50'
                : 'border-green-200 text-green-600 hover:border-green-400 hover:bg-green-50'
            }`}
          >
            + Add time block for {dayName}
          </button>
        )}
      </div>

      {/* ── Summary across all days ────────────────────────────────────────── */}
      {freeCount === 0 && tab === 'free' && (
        <div className="card border-l-4 border-yellow-400 bg-yellow-50">
          <p className="text-sm text-yellow-700 font-medium">
            ⚠️ No study windows set yet
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Without study windows, your weekly plan will use default times (09:00 and 15:00).
            Add at least one window per study day for a personalised schedule.
          </p>
        </div>
      )}

      {/* ── Preferences ───────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Study preferences ⚙️</h2>
        <div>
          <label className="text-sm text-gray-600 block mb-1.5">
            Preferred session length
          </label>
          <select
            value={targetStudyMinutes}
            onChange={e => { setTargetStudyMinutes(Number(e.target.value)); setSaveSuccess(false) }}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400"
          >
            {SESSION_LENGTHS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Used as a fallback when a lesson has no estimated duration.
          </p>
        </div>
      </div>

      {/* ── Save section ──────────────────────────────────────────────────── */}
      {saveError && (
        <div className="card border-l-4 border-red-400 bg-red-50 py-3">
          <p className="text-sm text-red-700">⚠️ {saveError}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="card border-l-4 border-green-400 bg-green-50 py-3">
          <p className="text-sm text-green-700 font-medium">
            ✓ Schedule saved! Your weekly plan will now use these time windows.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="btn-primary w-full py-3 text-base"
      >
        {isPending ? 'Saving…' : '✓ Save my schedule'}
      </button>

      <p className="text-xs text-gray-400 text-center pb-2">
        Changes take effect the next time you generate your weekly plan.
      </p>
    </div>
  )
}
