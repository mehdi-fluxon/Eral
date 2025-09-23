import TodoList from './components/TodoList'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Todo App
          </h1>
          <p className="text-gray-600">
            Keep track of your tasks with PostgreSQL
          </p>
        </header>
        
        <main className="bg-white rounded-xl shadow-lg p-6">
          <TodoList />
        </main>
        
        <footer className="text-center mt-8 text-sm text-gray-600">
          Built with Next.js, TypeScript, Prisma & PostgreSQL
        </footer>
      </div>
    </div>
  )
}