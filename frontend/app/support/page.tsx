'use client'

import React, { useState } from 'react'
import { HelpCircle, MessageSquare, BookOpen, LifeBuoy, Send } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import { useAuthStore } from '../../lib/store'
import { useToastStore } from '../../lib/toast'

const faqs = [
  { q: 'How do I create a request?', a: 'Open Requests and click “New Request”, then pick the services you need and submit.' },
  { q: 'When am I charged?', a: 'Payment is only initiated once the provider delivers and you review the work. Funds are released on acceptance.' },
  { q: 'How do providers get paid?', a: 'After a successful payment, the platform deducts its commission and schedules the provider payout.' },
  { q: 'Can I message my provider?', a: 'Yes — use the Messages tab to chat with your assigned provider in real time.' },
]

export default function SupportPage() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const role = user?.user_type || 'customer'
  const [message, setMessage] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      addToast('Please enter a message.', 'error')
      return
    }
    addToast('Support request sent. We’ll be in touch shortly.', 'success')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType={role} />
      <div className="lg:ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8 max-w-4xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Help &amp; Support</h2>
            <p className="text-gray-500 mt-1">Find answers or reach out to our team.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: MessageSquare, label: 'Live Chat', desc: 'Talk to us now' },
              { icon: BookOpen, label: 'Guides', desc: 'Step-by-step help' },
              { icon: LifeBuoy, label: 'Status', desc: 'Platform health' },
            ].map((c) => {
              const Icon = c.icon
              return (
                <div key={c.label} className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Icon size={20} />
                  </div>
                  <p className="font-semibold text-gray-900">{c.label}</p>
                  <p className="text-sm text-gray-500">{c.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-gray-900">Frequently asked</h3>
              </div>
              <div className="space-y-4">
                {faqs.map((f) => (
                  <div key={f.q}>
                    <p className="font-medium text-gray-900">{f.q}</p>
                    <p className="text-sm text-gray-500 mt-1">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact us</h3>
              <form onSubmit={submit} className="space-y-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Describe your issue…"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                >
                  <Send size={16} /> Send message
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
