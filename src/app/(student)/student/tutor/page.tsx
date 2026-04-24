import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import TutorChat from '@/components/TutorChat'

export default async function TutorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service client — auth already verified above; regular server client
  // does not reliably propagate session to RLS in server components.
  const admin = createServiceClient()
  const { data: student } = await admin
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!student) redirect('/')

  // Service client bypasses RLS recursion caused by admin policies referencing profiles
  const { data: subjects } = await admin.from('subjects').select('*')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Tutor 🤖</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask anything about your lessons. Your tutor will guide you step by step — not just give you answers.
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">
            <strong>Tip:</strong> Tell the tutor which subject and what you already tried. The more context you give, the better the help.
          </p>
        </div>
        <div className="p-4">
          <div className="flex gap-2 flex-wrap mb-4">
            {(subjects as { id: string; icon: string; name: string; color: string }[] | null)?.map(s => (
              <span
                key={s.id}
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: s.color + '20', color: s.color }}
              >
                {s.icon} {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <TutorChat
        studentId={student.id}
        subject="All Subjects"
      />
    </div>
  )
}
