'use client'

import { useState, useEffect } from 'react'
import TodoItem from './TodoItem'
import TodoForm from './TodoForm'

interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos')
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  const handleUpdate = () => {
    fetchTodos()
  }

  const handleDelete = () => {
    fetchTodos()
  }

  const handleAdd = () => {
    fetchTodos()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-gray-500">Loading todos...</div>
      </div>
    )
  }

  return (
    <div>
      <TodoForm onAdd={handleAdd} />
      
      {todos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No todos yet. Add one above!
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      
      {todos.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          {todos.filter(t => !t.completed).length} of {todos.length} remaining
        </div>
      )}
    </div>
  )
}