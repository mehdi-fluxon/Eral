'use client'

import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/app/hooks/useToast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Rich text renderer with full markdown support
const MessageRenderer = ({ content, role }: { content: string; role: 'user' | 'assistant' }) => {
  if (role === 'user') {
    return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
  }

  return (
    <div className="markdown-content leading-tight">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        ul: ({ ...props }) => <ul className="list-disc ml-4 space-y-0.5" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal ml-4 space-y-0.5" {...props} />,
        li: ({ ...props }) => <li className="my-0" {...props} />,
        p: ({ ...props }) => <p className="my-1" {...props} />,
        h1: ({ ...props }) => <h1 className="text-xl font-bold my-2" {...props} />,
        h2: ({ ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
        h3: ({ ...props }) => <h3 className="text-base font-semibold my-1.5" {...props} />,
        code: ({ inline, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) =>
          inline ? (
            <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
          ) : (
            <code className="block bg-gray-800 text-gray-100 p-3 rounded my-2 overflow-x-auto" {...props} />
          ),
        a: ({ ...props }) => <a className="text-indigo-600 hover:underline" target="_blank" rel="noopener" {...props} />,
        strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
        em: ({ ...props }) => <em className="italic" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversation from localStorage on mount
  useEffect(() => {
    const savedThreadId = localStorage.getItem('luxon-ai-threadId')
    const savedMessages = localStorage.getItem('luxon-ai-messages')
    
    if (savedThreadId && savedMessages) {
      setThreadId(savedThreadId)
      try {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages.map((msg: Message & { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
      } catch (error) {
        console.error('Error loading saved messages:', error)
        initializeWelcomeMessage()
      }
    } else {
      initializeWelcomeMessage()
    }
  }, [])

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('luxon-ai-messages', JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    if (threadId) {
      localStorage.setItem('luxon-ai-threadId', threadId)
    }
  }, [threadId])

  const initializeWelcomeMessage = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi! I'm your LuxonAI assistant. I can help you manage your contacts using natural language.

Try asking me things like:
• "Show me all overdue contacts"
• "Add John Smith from TechCorp as a new contact"
• "I talked to Jane Smith and she was happy about our proposal, call her in 2 days"
• "What are my follow-ups for this week?"

What would you like to do?`,
      timestamp: new Date()
    }])
  }

  const handleQuickAction = (query: string) => {
    setInput(query)
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          threadId: threadId
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Always update thread ID from response (handles thread recreation)
        if (data.threadId && data.threadId !== threadId) {
          setThreadId(data.threadId)
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        showToast('Failed to get response from AI agent', 'error')
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      showToast('Failed to send message', 'error')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered a network error. Please check your connection and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearConversation = () => {
    localStorage.removeItem('luxon-ai-threadId')
    localStorage.removeItem('luxon-ai-messages')
    setThreadId(null)
    initializeWelcomeMessage()
  }

  return (
    <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  🤖 LuxonAI Agent
                </h1>
                <p className="text-gray-600">
                  Manage your contacts using natural language. Ask me anything about your relationship pipeline!
                </p>
              </div>
              <button
                onClick={clearConversation}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear Chat
              </button>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 320px)', minHeight: '500px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg px-4 py-2.5 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white shadow-indigo-100'
                        : 'bg-gray-50 text-gray-900 shadow-gray-100 border border-gray-100'
                    }`}
                  >
                    <MessageRenderer content={message.content} role={message.role} />
                    <div
                      className={`text-xs mt-1.5 ${
                        message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 text-gray-900 rounded-lg px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Thinking</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => handleQuickAction("Show me all overdue contacts")}
                  disabled={isLoading}
                  className="text-xs bg-white hover:bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200 transition-colors disabled:opacity-50"
                >
                  📅 Overdue contacts
                </button>
                <button
                  onClick={() => handleQuickAction("What are my follow-ups for this week?")}
                  disabled={isLoading}
                  className="text-xs bg-white hover:bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200 transition-colors disabled:opacity-50"
                >
                  📋 This week
                </button>
                <button
                  onClick={() => handleQuickAction("Show me dashboard stats")}
                  disabled={isLoading}
                  className="text-xs bg-white hover:bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200 transition-colors disabled:opacity-50"
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => handleQuickAction("Add a new contact")}
                  disabled={isLoading}
                  className="text-xs bg-white hover:bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200 transition-colors disabled:opacity-50"
                >
                  ➕ Add contact
                </button>
              </div>

              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about your contacts..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white"
                    rows={2}
                    disabled={isLoading}
                  />
                  <div className="text-xs text-gray-500 mt-1.5">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors self-start shadow-sm"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Example Queries */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💡 Example Queries
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">View & Search</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• &quot;Show me all overdue contacts&quot;</div>
                  <div>• &quot;Who needs follow-up this week?&quot;</div>
                  <div>• &quot;Find contacts at fintech companies&quot;</div>
                  <div>• &quot;Dashboard stats&quot;</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Add & Update</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• &quot;Add Sarah Kim from HealthTech&quot;</div>
                  <div>• &quot;I called John about the proposal&quot;</div>
                  <div>• &quot;Jane wants a follow-up in 2 days&quot;</div>
                  <div>• &quot;Update Mike&apos;s job title to VP&quot;</div>
                </div>
              </div>
            </div>
          </div>
    </div>
  )
}