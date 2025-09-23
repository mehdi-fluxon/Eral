'use client'

import { useState } from 'react'

interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

interface TodoItemProps {
  todo: Todo
  onUpdate: () => void
  onDelete: () => void
}

export default function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !todo.completed }),
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to update todo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE',
      })
      onDelete()
    } catch (error) {
      console.error('Failed to delete todo:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all group">
      <div className="relative">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggle}
          disabled={loading}
          className="w-5 h-5 text-[#123ef6] rounded cursor-pointer focus:ring-2 focus:ring-[#123ef6] focus:ring-offset-2"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-[#123ef6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <span
          className={`block font-medium transition-all ${
            todo.completed 
              ? 'line-through text-gray-500' 
              : 'text-gray-800'
          }`}
        >
          {todo.title}
        </span>
        <span className="text-xs text-gray-500 mt-1">
          {new Date(todo.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {todo.completed && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Done
          </span>
        )}
        
        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
          title="Delete task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}