'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LinkChildForm() {
  const [code, setCode]       = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTrans] = useTransition()
  const router                = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Please enter an invite code.'); return }

    setError(null)
    startTrans(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated — please log in again.'); return }

      const { data, error: rpcErr } = await supabase.rpc('claim_invite_code', {
        p_code:              trimmed,
        p_parent_profile_id: user.id,
      })

      if (rpcErr) {
        setError(rpcErr.message)
        return
      }
      if (!data?.success) {
        setError((data?.error as string | undefined) ?? 'Invalid or expired code. Ask your child for a new one.')
        return
      }

      setSuccess(true)
      router.refresh()
    })
  }

  if (success) {
    return (
      <div className="text-center space-y-2 py-4">
        <div className="text-4xl">🎉</div>
        <p className="font-semibold text-green-700">Child linked successfully!</p>
        <p className="text-sm text-gray-500">The page is refreshing with their data…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2 justify-center max-w-sm mx-auto">
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          name="code"
          type="text"
          className="input flex-1 font-mono tracking-widest uppercase text-center"
          placeholder="XXXX-XXXX"
          maxLength={9}
          disabled={pending}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {pending ? '⏳' : 'Link'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center max-w-sm mx-auto">{error}</p>
      )}
    </form>
  )
}
