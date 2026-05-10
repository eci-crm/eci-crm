'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCRMStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

// ─── Suggestion Chips ────────────────────────────────────────────────────────

const DEFAULT_SUGGESTIONS = [
  'Dashboard summary',
  'Proposal win rate',
  'Target progress',
  'Upcoming deadlines',
]

const FOLLOW_UP_SUGGESTIONS_MAP: Record<string, string[]> = {
  dashboard: ['Monthly trends', 'Top clients', 'Team performance'],
  win: ['Compare with last year', 'Service-wise wins', 'How to improve'],
  target: ['Quarterly breakdown', 'Remaining target', 'Gap analysis'],
  deadline: ['Overdue proposals', 'This week deadlines', 'Pipeline status'],
  service: ['Revenue by service', 'Service growth', 'Best performing service'],
  client: ['Active vs inactive', 'Top clients', 'Client acquisition'],
  team: ['Team leaderboard', 'Individual performance', 'Workload distribution'],
  default: ['Show more details', 'Historical comparison', 'Strategic insights'],
}

function getFollowUpSuggestions(lastMessage: string): string[] {
  const lower = lastMessage.toLowerCase()
  if (lower.includes('dashboard') || lower.includes('summary') || lower.includes('overview')) {
    return FOLLOW_UP_SUGGESTIONS_MAP.dashboard
  }
  if (lower.includes('win') || lower.includes('rate') || lower.includes('success')) {
    return FOLLOW_UP_SUGGESTIONS_MAP.win
  }
  if (lower.includes('target') || lower.includes('progress') || lower.includes('goal')) {
    return FOLLOW_UP_SUGGESTIONS_MAP.target
  }
  if (lower.includes('deadline') || lower.includes('overdue') || lower.includes('due')) {
    return FOLLOW_UP_SUGGESTIONS_MAP.deadline
  }
  if (lower.includes('service') || lower.includes('revenue') || lower.includes('business')) {
    return FOLLOW_UP_SUGGESTIONS_MAP.service
  }
  if (lower.includes('client') || lower.includes('customer')) {
    return FOLLOW_UP_SUGGESTIONS_MAP.client
  }
  if (lower.includes('team') || lower.includes('member') || lower.includes('performance')) {
    return FOLLOW_UP_SUGGESTIONS_MAP.team
  }
  return FOLLOW_UP_SUGGESTIONS_MAP.default
}

// ─── Message Formatting ──────────────────────────────────────────────────────

function formatMessageContent(content: string): React.ReactNode {
  // Simple formatting: bold text between ** ** and bullet points
  const lines = content.split('\n')
  return lines.map((line, i) => {
    // Handle bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      return <div key={i} className="ml-2">{line}</div>
    }
    // Handle bold text
    const parts = line.split(/\*\*(.*?)\*\*/g)
    if (parts.length > 1) {
      return (
        <div key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </div>
      )
    }
    return line ? <div key={i}>{line}</div> : <br key={i} />
  })
}

// ─── Loading Dots Animation ──────────────────────────────────────────────────

function LoadingDots({ isECITheme }: { isECITheme: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground mr-1">Thinking</span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full ${isECITheme ? 'bg-blue-400' : 'bg-emerald-400'}`}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Time Formatting ─────────────────────────────────────────────────────────

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Chatbot Component ───────────────────────────────────────────────────────

export function CRMChatbot() {
  const { theme } = useCRMStore()
  const isECITheme = theme === 'eci'

  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Fetch chat history
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages'],
    queryFn: async () => {
      const r = await fetch('/api/chat')
      if (!r.ok) throw new Error('Failed to fetch chat history')
      return r.json()
    },
    enabled: isOpen,
  })

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] })
      // Update suggestions based on assistant response
      if (data?.content) {
        setSuggestions(getFollowUpSuggestions(data.content))
      }
    },
    onError: () => {
      toast.error('Failed to send message. Please try again.')
    },
  })

  // Clear chat mutation
  const clearChat = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/chat', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to clear chat')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] })
      setSuggestions(DEFAULT_SUGGESTIONS)
      toast.success('Chat history cleared')
    },
  })

  const handleClearChat = useCallback(() => {
    clearChat.mutate()
  }, [clearChat])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      const container = messagesContainerRef.current
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
      }
    }
    // Use requestAnimationFrame to ensure DOM has updated
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToBottom)
    })
    // Fallback timeouts for delayed renders
    const timer = setTimeout(scrollToBottom, 100)
    const laterTimer = setTimeout(scrollToBottom, 300)
    const finalTimer = setTimeout(scrollToBottom, 600)
    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timer)
      clearTimeout(laterTimer)
      clearTimeout(finalTimer)
    }
  }, [messages, sendMessage.isPending])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed || sendMessage.isPending) return
    sendMessage.mutate(trimmed)
    setInputValue('')
  }, [inputValue, sendMessage])

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (sendMessage.isPending) return
      sendMessage.mutate(suggestion)
    },
    [sendMessage]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Theme-aware class helpers
  const floatingBtnBg = isECITheme
    ? 'bg-gradient-to-br from-blue-700 to-red-600'
    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
  const floatingBtnShadow = isECITheme
    ? 'shadow-blue-500/30 hover:shadow-blue-500/40'
    : 'shadow-emerald-500/30 hover:shadow-emerald-500/40'
  const pingDot = isECITheme ? 'bg-blue-400' : 'bg-emerald-400'
  const pingDotSolid = isECITheme ? 'bg-blue-500' : 'bg-emerald-500'
  const headerGradient = isECITheme
    ? 'bg-gradient-to-r from-blue-700 to-red-600'
    : 'bg-gradient-to-r from-emerald-500 to-teal-600'
  const headerSubtitle = isECITheme ? 'text-blue-100' : 'text-emerald-100'
  const botAvatarBg = isECITheme
    ? 'bg-blue-100 dark:bg-blue-950/40'
    : 'bg-emerald-100 dark:bg-emerald-950/40'
  const botIconColor = isECITheme
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-emerald-600 dark:text-emerald-400'
  const emptyIconBg = isECITheme
    ? 'bg-blue-50 dark:bg-blue-950/30'
    : 'bg-emerald-50 dark:bg-emerald-950/30'
  const emptyIconColor = isECITheme
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-emerald-600 dark:text-emerald-400'
  const sendBtnGradient = isECITheme
    ? 'bg-gradient-to-br from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700'
    : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
  const inputFocusRing = isECITheme
    ? 'focus-visible:ring-blue-500/30'
    : 'focus-visible:ring-emerald-500/30'
  const suggestionHover = isECITheme
    ? 'hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-400'
    : 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400'

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ${floatingBtnBg} ${floatingBtnShadow} transition-shadow`}
            aria-label="Open CRM Assistant"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${pingDot} opacity-75`} />
              <span className={`relative inline-flex h-4 w-4 rounded-full ${pingDotSolid}`} />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl dark:bg-slate-900"
            style={{ width: 400, height: 560 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between border-b ${headerGradient} px-4 py-3`}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">CRM Assistant</h3>
                  <p className={`text-[10px] ${headerSubtitle}`}>Powered by AI</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Clear chat history"
                  title="Clear chat history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4"
              style={{ scrollbarWidth: 'thin', scrollbarGutter: 'stable' }}
            >
              {messages.length === 0 && !sendMessage.isPending ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${emptyIconBg}`}>
                    <Bot className={`h-6 w-6 ${emptyIconColor}`} />
                  </div>
                  <p className="text-sm font-medium text-foreground">Hello! 👋</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-[260px]">
                    I&apos;m your CRM assistant with real-time access to all your data. Ask me about proposals, clients, targets, deadlines, or any business insights.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      {msg.role === 'assistant' ? (
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${botAvatarBg}`}>
                          <Bot className={`h-3.5 w-3.5 ${botIconColor}`} />
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                          <User className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`max-w-[75%] break-words rounded-2xl px-3.5 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                        style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
                      >
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                          {formatMessageContent(msg.content)}
                        </p>
                        <p
                          className={`mt-1 text-[10px] ${
                            msg.role === 'user'
                              ? 'text-primary-foreground/60'
                              : 'text-muted-foreground/60'
                          }`}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {sendMessage.isPending && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="flex gap-2"
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${botAvatarBg}`}>
                        <Bot className={`h-3.5 w-3.5 ${botIconColor}`} />
                      </div>
                      <div className="rounded-2xl bg-muted px-4 py-3">
                        <LoadingDots isECITheme={isECITheme} />
                      </div>
                    </motion.div>
                  )}

                  {/* Scroll anchor */}
                  <div className="h-1" />
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="border-t border-border/50 px-3 py-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={sendMessage.isPending}
                    className={`shrink-0 rounded-full border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors ${suggestionHover} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  disabled={sendMessage.isPending}
                  className={`h-9 flex-1 rounded-full border-border/50 bg-muted/50 text-sm ${inputFocusRing}`}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || sendMessage.isPending}
                  className={`h-9 w-9 shrink-0 rounded-full ${sendBtnGradient} shadow-sm`}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
