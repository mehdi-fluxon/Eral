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
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        disabled={loading}
        className="w-5 h-5 text-blue-500 rounded cursor-pointer"
      />
      <span
        className={`flex-1 ${
          todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
        }`}
      >
        {todo.title}
      </span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  )
}