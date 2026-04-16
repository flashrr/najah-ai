'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const [code, setCode]       = useState('')
  const [copied, setCopied]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function fetchCode() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (!student) { setError('Student profile not found.'); setLoading(false); return }

      const { data, error: rpcErr } = await supabase.rpc('generate_invite_code', {
        p_student_id: student.id,
      })

      if (rpcErr) { setError(rpcErr.message); setLoading(false); return }

      setCode(data as string)
      setLoading(false)
    }
    fetchCode()
  }, [])

  async function handleCopy() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invite Your Parent 🔗</h1>
        <p className="text-sm text-gray-500 mt-1">
          Share this code with your parent so they can track your progress.
        </p>
      </div>

      <div className="card text-center space-y-4">
        <p className="text-sm text-gray-500">Your invite code</p>

        {loading ? (
          <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (
          <>
            <div className="text-4xl font-bold font-mono tracking-widest text-brand-700 py-5 bg-brand-50 rounded-xl select-all">
              {code}
            </div>
            <p className="text-xs text-gray-400">Valid for 30 days · Can only be used once</p>
            <button
              onClick={handleCopy}
              className={`btn-primary w-full transition-all ${copied ? 'bg-green-600 hover:bg-green-600' : ''}`}
            >
              {copied ? '✓ Copied!' : '📋 Copy code'}
            </button>
          </>
        )}
      </div>

      <div className="card border-l-4 border-brand-400">
        <h3 className="font-semibold text-brand-700 mb-2">How it works</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Copy the code above</li>
          <li>Ask your parent to create an account (choose &ldquo;Parent&rdquo; when signing up)</li>
          <li>On their dashboard, they enter this code to link your account</li>
          <li>They can then see your progress, scores, and recommendations</li>
        </ol>
      </div>
    </div>
  )
}
