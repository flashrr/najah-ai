import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LinkChildForm from '@/components/LinkChildForm'

export default async function LinkStudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/parent/dashboard" className="text-brand-600 hover:underline text-sm">
          ← Back to dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Link a child&apos;s account 🔗</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter the invite code your child shared with you.
        </p>
      </div>

      <div className="card space-y-4">
        <p className="text-sm text-gray-600 text-center">Enter the 8-character code</p>
        <LinkChildForm />
      </div>

      <div className="card border-l-4 border-brand-400">
        <h3 className="font-semibold text-brand-700 mb-2">Where to find the code</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Your child opens the Najah AI app</li>
          <li>They go to <strong>Invite</strong> in their navigation</li>
          <li>They copy and share the 8-character code with you</li>
          <li>Enter it above — each code works once and expires in 30 days</li>
        </ol>
      </div>
    </div>
  )
}
