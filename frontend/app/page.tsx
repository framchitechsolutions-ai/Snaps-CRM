'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, FileText, ShieldCheck, Zap, Users } from 'lucide-react'

const features = [
  { icon: FileText, title: 'Document Management', desc: 'Upload, organise and securely share project documents and deliverables.' },
  { icon: Zap, title: 'Fast Turnaround', desc: 'Get matched with verified providers and track every request in real time.' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'Pay only when work is accepted, with protected transactions and invoices.' },
  { icon: Users, title: 'Provider Network', desc: 'A curated network of technical service providers ready to deliver.' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold">D</div>
            <span className="font-bold text-lg tracking-tight text-sidebar">DCMT</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-sidebar" />
        <svg
          className="absolute right-0 top-0 h-full w-1/2 text-background opacity-100"
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M100,0 C45,220 45,780 100,1000 L100,1000 L100,0 Z" />
        </svg>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-primary-light text-sm font-medium mb-6">
              Document Management &amp; Technical Services
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Your projects, delivered with precision.
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-xl">
              DCMT connects you with verified technical service providers, manages your documents
              end-to-end, and keeps payments secure until work is accepted.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
              >
                Get started <ArrowRight size={18} />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Everything you need to deliver</h2>
          <p className="mt-3 text-gray-500">From request to release, managed in one platform.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="bg-surface rounded-xl shadow-card p-6 border border-gray-100 hover:shadow-elevated transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-purple p-10 lg:p-14 text-center">
          <h3 className="text-3xl font-bold text-white">Ready to get started?</h3>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">
            Create a request in minutes and let verified providers handle the rest.
          </p>
          <Link
            href="/auth/signup"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Create your account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 text-sm text-gray-400">
          © {new Date().getFullYear()} DCMT. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
