/**
 * Landing page — fully static, zero client logic.
 *
 * Structural decision: NO root <div> wrapper.
 * <header>, <main>, <footer> are direct children of <body> (via Fragment).
 * The layout classes (min-h-screen flex flex-col) are on <body> in layout.tsx.
 *
 * This eliminates the tree position <header>-inside-<div> that was causing
 * "Expected server HTML to contain a matching <header> in <div>".
 *
 * Rules:
 *  - No useEffect, useState, mounted checks
 *  - No window / localStorage / sessionStorage
 *  - No auth / session / conditional rendering
 *  - No dynamic import
 *  - No new Date() / Math.random() during render
 *  - No suppressHydrationWarning
 *  - COPYRIGHT_YEAR is a compile-time constant
 */

import Link from 'next/link'

const COPYRIGHT_YEAR = 2026

const features = [
  {
    icon: '🎯',
    title: 'Diagnostic Test',
    body: 'We find your weak spots first. No wasted time on what you already know.',
  },
  {
    icon: '📅',
    title: 'Weekly Plan',
    body: 'A short focused plan built from your results — updated every week.',
  },
  {
    icon: '🤖',
    title: 'AI Tutor',
    body: 'Ask anything. Your coach guides you step by step without giving away the answer.',
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Parent Dashboard',
    body: 'Parents see exactly where the student is, what improved, and what to do next.',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* HEADER — direct child of <body>, no wrapping <div> */}
      <header className="border-b border-gray-100">
        <div className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🎓</span>
            <span className="font-bold text-xl text-brand-700">Najah AI</span>
          </Link>
          <div className="flex gap-2 sm:gap-3">
            <Link href="/login" className="btn-secondary text-sm px-3 sm:px-4">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm px-3 sm:px-4">Get started</Link>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1">

        {/* HERO */}
        <section className="max-w-3xl mx-auto px-6 py-12 sm:py-20 text-center">
          <div className="inline-block bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
            For 3ème Collège Students 🇲🇦
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Learn smarter.<br />
            <span className="text-brand-600">Improve every week.</span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Najah AI gives your child a personalised learning plan, short lessons,
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

        {/* FEATURE CARDS */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-center text-2xl font-bold mb-10">Why Najah AI works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <div key={f.title} className="card text-center">
                  <div className="text-3xl mb-3" aria-hidden="true">{f.icon}</div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="bg-brand-600 py-16 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to improve your grades?</h2>
          <p className="text-brand-100 mb-8">
            Join Moroccan 3ème students already using Najah AI.
          </p>
          <Link
            href="/register"
            className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors inline-block"
          >
            Create your free account
          </Link>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="text-center py-8 text-sm text-gray-500">
        © {COPYRIGHT_YEAR} Najah AI — Built for Moroccan students
      </footer>
    </>
  )
}
