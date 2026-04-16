import Link from 'next/link'

const subjects = [
  { icon: '📐', name: 'Mathematics',       desc: 'Algebra, equations, geometry' },
  { icon: '⚗️', name: 'Physics-Chemistry', desc: 'Forces, electricity, reactions' },
  { icon: '📖', name: 'English',           desc: 'Reading, writing, BIOA prep' },
  { icon: '🧩', name: 'Logic & IQ',        desc: 'Patterns, deduction, reasoning' },
  { icon: '💻', name: 'Coding Basics',     desc: 'Python, algorithms, projects' },
]

const features = [
  { icon: '🎯', title: 'Diagnostic First',   body: 'We identify your weak points before you start, so you never waste time on what you already know.' },
  { icon: '📅', title: 'Weekly Plans',       body: 'A personalised plan built around your results — short, focused, and achievable.' },
  { icon: '🤖', title: 'AI Tutor',           body: 'Ask anything. Your AI coach guides you step-by-step without just giving you the answer.' },
  { icon: '👨‍👩‍👧', title: 'Parent Dashboard', body: 'Parents see progress, weak areas, and weekly recommendations — clear and simple.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-xl text-brand-700">Najah AI</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary text-sm">Sign in</Link>
          <Link href="/register" className="btn-primary text-sm">Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
          For 3ème Collège Students 🇲🇦
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Learn smarter.<br />
          <span className="text-brand-600">Improve every week.</span>
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Najah AI gives your child a personalised learning plan, interactive lessons,
          instant feedback, and an AI tutor — so they build real skills, not just memorise.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-base px-8 py-3">
            Start learning — it&apos;s free
          </Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-3">
            I already have an account
          </Link>
        </div>
      </section>

      {/* SUBJECTS */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-center text-2xl font-bold mb-10">5 Subjects. All in one place.</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {subjects.map(s => (
              <div key={s.name} className="card text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-center text-2xl font-bold mb-10">Why Najah AI works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(f => (
              <div key={f.title} className="card flex gap-4">
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-600">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-16 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to improve your grades?</h2>
        <p className="text-brand-100 mb-8">Join hundreds of 3ème students already using Najah AI.</p>
        <Link href="/register" className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors inline-block">
          Create your free account
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 text-sm text-gray-500">
        © {new Date().getFullYear()} Najah AI — Built for Moroccan students
      </footer>
    </div>
  )
}
