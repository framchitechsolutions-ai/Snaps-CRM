'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  Phone,
  Send,
  Smile,
  Paperclip,
} from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import { useAuthStore } from '../../lib/store'
import { useToastStore } from '../../lib/toast'
import apiClient from '../../lib/apiClient'

interface ApiUser {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: string
  is_online: boolean
}

interface ApiMessage {
  id: number
  sender: number
  conversation_id: number
  content: string
  timestamp: string
  is_read: boolean
}

interface ApiConversation {
  id: number
  participants: ApiUser[]
  messages: ApiMessage[]
}

interface UiConversation {
  id: number
  contactId?: number
  isContact?: boolean
  name: string
  preview: string
  time: string
  unread: boolean
  online: boolean
  initials: string
  gradient: string
  other: ApiUser
}

const gradients = [
  'from-primary to-purple',
  'from-warning to-danger',
  'from-success to-primary',
  'from-orange-400 to-orange-600',
  'from-purple to-primary',
  'from-primary to-success',
  'from-danger to-warning',
  'from-warning to-primary',
]

function initialsFromName(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length) return parts.map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (email[0] || '?').toUpperCase()
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function dateDividerLabel(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function buildConversations(data: ApiConversation[], meId?: number): UiConversation[] {
  return data.map((c) => {
    const other = c.participants.find((p) => p.id !== meId) || c.participants[0]
    const last = c.messages[c.messages.length - 1]
    return {
      id: c.id,
      name: `${other.first_name} ${other.last_name}`.trim() || other.email,
      preview: last?.content || 'No messages yet',
      time: formatTime(last?.timestamp),
      unread: c.messages.some((m) => !m.is_read && m.sender !== meId),
      online: !!other?.is_online,
      initials: initialsFromName(`${other.first_name} ${other.last_name}`, other.email),
      gradient: gradients[c.id % gradients.length],
      other,
    }
  })
}

function wsBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  try {
    const u = new URL(base)
    const proto = u.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${u.host}`
  } catch {
    return 'ws://localhost:8000'
  }
}

function authToken(): string | null {
  return localStorage.getItem('access_token') || useAuthStore.getState().token || null
}

export default function MessagingPage() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const meId = user?.id
  const role = user?.user_type || 'customer'

  const [conversations, setConversations] = useState<UiConversation[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [query, setQuery] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  const chatSocket = useRef<WebSocket | null>(null)
  const notifSocket = useRef<WebSocket | null>(null)

  const sendReadReceipt = useCallback(() => {
    const ws = chatSocket.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'read' }))
    }
  }, [])

  const refreshConversations = useCallback(async () => {
    try {
      const [convRes, contactsRes] = await Promise.all([
        apiClient.get('/messaging/'),
        apiClient.get('/messaging/contacts/'),
      ])
      const mine = buildConversations(convRes.data, meId)
      const contactEntries: UiConversation[] = (contactsRes.data as any[])
        .filter((c) => !c.conversation_id)
        .map((c) => ({
          id: -c.id,
          contactId: c.id,
          isContact: true,
          name: c.name,
          preview: 'Start a conversation',
          time: '',
          unread: false,
          online: !!c.is_online,
          initials: initialsFromName(c.name, c.email),
          gradient: gradients[c.id % gradients.length],
          other: {
            id: c.id,
            email: c.email,
            first_name: c.name.split(' ')[0] || '',
            last_name: c.name.split(' ').slice(1).join(' ') || '',
            user_type: role === 'provider' ? 'customer' : 'provider',
            is_online: !!c.is_online,
          },
        }))
      setConversations([...mine, ...contactEntries])
      setSelectedId((prev) => prev ?? mine[0]?.id ?? null)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [meId, role])

  const refreshMessages = useCallback(async (id: number) => {
    try {
      const res = await apiClient.get(`/messaging/${id}/`)
      setMessages(res.data.messages || [])
    } catch {
      setMessages([])
    }
  }, [])

  // Initial load of conversations + contacts, and notifications socket.
  useEffect(() => {
    refreshConversations()

    const token = authToken()
    if (token) {
      const ws = new WebSocket(`${wsBase()}/ws/notifications/?token=${token}`)
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'notification') {
            addToast(data.notification.message, 'info')
          }
        } catch {
          /* ignore */
        }
      }
      notifSocket.current = ws
    }
    return () => {
      notifSocket.current?.close()
    }
  }, [refreshConversations, addToast])

  // Load messages + open chat socket when a conversation is selected.
  useEffect(() => {
    if (selectedId == null || selectedId < 0) return
    refreshMessages(selectedId)

    const token = authToken()
    if (!token) return
    const ws = new WebSocket(`${wsBase()}/ws/chat/${selectedId}/?token=${token}`)
    ws.onopen = () => ws.send(JSON.stringify({ type: 'read' }))
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'message') {
          const m = data.message as ApiMessage
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
          setConversations((prev) =>
            prev.map((c) =>
              c.id === m.conversation_id
                ? {
                    ...c,
                    preview: m.content,
                    time: formatTime(m.timestamp),
                    unread: m.sender !== meId ? true : c.unread,
                  }
                : c
            )
          )
          if (m.conversation_id === selectedId && m.sender !== meId) sendReadReceipt()
        } else if (data.type === 'messages_read') {
          if (data.by !== meId) {
            setConversations((prev) =>
              prev.map((c) => (c.id === data.conversation_id ? { ...c, unread: false } : c))
            )
          }
        }
      } catch {
        /* ignore */
      }
    }
    chatSocket.current = ws
    return () => {
      ws.close()
    }
  }, [selectedId, refreshMessages, sendReadReceipt, meId])

  const handleSelect = async (c: UiConversation) => {
    if (c.isContact && c.contactId) {
      try {
        const res = await apiClient.post('/messaging/conversations/', {
          participant_id: c.contactId,
        })
        const newId = res.data.id as number
        setSelectedId(newId)
        await refreshConversations()
      } catch {
        addToast('Could not start the conversation.', 'error')
      }
    } else {
      setSelectedId(c.id)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || selectedId == null || selectedId < 0) return
    try {
      const res = await apiClient.post(`/messaging/${selectedId}/`, { content: text })
      const m = res.data as ApiMessage
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
      setInput('')
      await refreshConversations()
    } catch {
      addToast('Failed to send message.', 'error')
    }
  }

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.preview.toLowerCase().includes(query.toLowerCase())
  )

  const selected = conversations.find((c) => c.id === selectedId) || null
  const lastTs = messages[messages.length - 1]?.timestamp
  const divider = dateDividerLabel(lastTs)

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar userType={role} />

      <div className="lg:ml-[246px] flex-1 flex flex-col h-screen">
        <DashboardHeader />

        <main className="flex-1 flex overflow-hidden">
          {/* Messages list */}
          <aside className="w-80 shrink-0 hidden md:flex flex-col border-r border-gray-200 bg-surface">
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Chat</h2>
                {conversations.some((c) => c.unread) && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {conversations.filter((c) => c.unread).length} new messages
                  </span>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages"
                  className="w-full pl-9 pr-3 py-2 bg-gray-100 border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="px-5 py-4 text-sm text-gray-400">Loading conversations…</p>
              ) : filtered.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">No conversations found.</p>
              ) : (
                filtered.map((c) => {
                  const active = c.id === selectedId
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className={`w-full flex items-start gap-3 px-5 py-3 text-left transition-colors ${
                        active ? 'bg-primary/10' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`relative shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                        {c.initials}
                        {c.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success ring-2 ring-surface" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                          <span className="text-[11px] text-gray-400 shrink-0">{c.time}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate ${c.unread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                            {c.preview}
                          </p>
                          {c.unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          {/* Chat interface */}
          <section className="flex-1 flex flex-col bg-background">
            {selected ? (
              <>
                {/* Chat header */}
                <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${selected.gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                      {selected.initials}
                      {selected.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success ring-2 ring-surface" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                      <p className="flex items-center gap-1.5 text-xs">
                        {selected.online ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-success" />
                            <span className="text-success">Online</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                            <span className="text-gray-400">Offline</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <Phone size={16} />
                      Call
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">
                      View profile
                    </button>
                  </div>
                </div>

                {/* Message thread */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 mt-8">No messages yet. Say hello!</p>
                  ) : (
                    <>
                      {divider && (
                        <div className="flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-400 bg-background px-3 py-1 rounded-full">
                            {divider}
                          </span>
                        </div>
                      )}
                      {messages.map((m) => {
                        const sent = m.sender === meId
                        if (sent) {
                          return (
                            <div key={m.id} className="flex justify-end">
                              <div className="max-w-md">
                                <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-white">
                                  {m.content}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1 text-right">{formatTime(m.timestamp)}</p>
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div key={m.id} className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selected.gradient} flex items-center justify-center text-white font-semibold text-xs shrink-0`}>
                              {selected.initials}
                            </div>
                            <div className="max-w-md">
                              <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2.5 text-sm text-gray-800">
                                {m.content}
                              </div>
                              <p className="text-[11px] text-gray-400 mt-1">{formatTime(m.timestamp)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>

                {/* Message input */}
                <div className="px-6 py-4 bg-surface border-t border-gray-200">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2">
                    <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                      <Smile size={20} />
                    </button>
                    <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                      <Paperclip size={20} />
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Message"
                      className="flex-1 bg-transparent px-2 py-1.5 text-sm focus:outline-none text-gray-800 placeholder-gray-400"
                    />
                    <button
                      onClick={handleSend}
                      className="p-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                Select a conversation to start messaging.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
