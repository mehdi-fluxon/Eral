'use client'

import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/app/hooks/useToast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Simple rich text renderer
const MessageRenderer = ({ content, role }: { content: string; role: 'user' | 'assistant' }) => {
  if (role === 'user') {
    return <div className="whitespace-pre-wrap">{content}</div>
  }

  // Parse markdown-like formatting for assistant messages
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/^- (.+)$/gm, '<div class="ml-4">• $1</div>') // Bullet points
      .replace(/^• (.+)$/gm, '<div class="ml-4">• $1</div>') // Bullet points
  }

  return (
    <div 
      className="whitespace-pre-wrap prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0"
      dangerouslySetInnerHTML={{ __html: formatText(content) }}
    />
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
• "Log a meeting with the CEO of Acme Corp about their expansion plans"

What would you like to do?`,
      timestamp: new Date()
    }])
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
        // Update thread ID if this is first message
        if (data.threadId && !threadId) {
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <MessageRenderer content={message.content} role={message.role} />
                    <div
                      className={`text-xs mt-2 ${
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
                  <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about your contacts... (e.g., 'Show me overdue contacts' or 'Add John Smith from TechCorp')"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    rows={2}
                    disabled={isLoading}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors self-start"
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