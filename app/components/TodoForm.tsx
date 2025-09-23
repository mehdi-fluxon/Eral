'use client'

import { useState } from 'react'

interface TodoFormProps {
  onAdd: () => void
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      if (response.ok) {
        setTitle('')
        onAdd()
      }
    } catch (error) {
      console.error('Failed to add todo:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a new task..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123ef6] focus:border-transparent transition-all"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-6 py-3 bg-gradient-to-r from-[#123ef6] to-[#0d3a9a] text-white rounded-lg hover:from-[#0d3a9a] hover:to-[#123ef6] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adding...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Task</span>
            </div>
          )}
        </button>
      </div>
    </form>
  )
}