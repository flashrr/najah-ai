'use client'

import { useState } from 'react'
import type { Exercise } from '@/lib/types'

interface ExerciseCardProps {
  exercise: Exercise
  index: number
  onAnswer: (exerciseId: string, answer: string, isCorrect: boolean) => void
  disabled?: boolean
  initialCorrect?: boolean   // present = previously answered; absent = fresh
}

export default function ExerciseCard({ exercise, index, onAnswer, disabled = false, initialCorrect }: ExerciseCardProps) {
  // If disabled AND we know the previous result, mount directly in review state
  const alreadyAnswered = disabled && initialCorrect !== undefined

  const [selected, setSelected]   = useState<string>('')
  const [submitted, setSubmitted] = useState(() => alreadyAnswered)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(() => alreadyAnswered ? initialCorrect : null)

  function normalise(s: string) {
    return s.trim().toLowerCase()
  }

  function handleSubmit() {
    if (!selected || submitted) return
    const correct = normalise(selected) === normalise(exercise.correct_answer)
    setIsCorrect(correct)
    setSubmitted(true)
    onAnswer(exercise.id, selected, correct)
  }

  const resultBorder = submitted
    ? isCorrect
      ? 'border-green-400 bg-green-50'
      : 'border-red-300 bg-red-50'
    : 'border-gray-100'

  return (
    <div className={`card border-2 ${resultBorder} transition-colors`}>
      {/* Question header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <p className="font-medium text-gray-800 leading-snug">{exercise.question}</p>
      </div>

      {/* MCQ options */}
      {exercise.type === 'mcq' && exercise.options && (
        <div className="space-y-2 mb-4">
          {exercise.options.map((opt, i) => {
            const letter = ['A', 'B', 'C', 'D'][i]
            const isSelected  = selected === opt
            const isAnswer    = normalise(opt) === normalise(exercise.correct_answer)
            let optClass = 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50'
            if (submitted) {
              if (isAnswer)                       optClass = 'border-green-400 bg-green-50 text-green-800'
              else if (isSelected && !isAnswer)   optClass = 'border-red-400 bg-red-50 text-red-800'
              else                                optClass = 'border-gray-100 bg-gray-50 text-gray-400'
            } else if (isSelected) {
              optClass = 'border-brand-500 bg-brand-50 text-brand-800'
            }

            return (
              <button
                key={opt}
                type="button"
                disabled={submitted || disabled}
                onClick={() => setSelected(opt)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${optClass}`}
              >
                <span className="font-semibold w-5">{letter}.</span>
                <span>{opt}</span>
                {submitted && isAnswer && <span className="ml-auto">✓</span>}
                {submitted && isSelected && !isAnswer && <span className="ml-auto">✗</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Short answer */}
      {exercise.type === 'short_answer' && (
        <div className="mb-4">
          <input
            type="text"
            className="input"
            placeholder="Your answer..."
            value={selected}
            onChange={e => setSelected(e.target.value)}
            disabled={submitted || disabled}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>
      )}

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selected || disabled}
          className="btn-primary text-sm"
        >
          Submit answer
        </button>
      )}

      {/* Feedback */}
      {submitted && (
        <div className={`mt-3 rounded-lg px-4 py-3 text-sm ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="font-semibold mb-1">
            {isCorrect ? '✓ Correct!' : '✗ Not quite.'}
            {!isCorrect && <span className="ml-2 font-normal">Correct answer: <strong>{exercise.correct_answer}</strong></span>}
          </p>
          <p>{exercise.explanation}</p>
        </div>
      )}
    </div>
  )
}
