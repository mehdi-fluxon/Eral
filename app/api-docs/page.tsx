'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch('/api/docs')
        const data = await response.json()
        setSpec(data)
      } catch (error) {
        console.error('Failed to load API spec:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSpec()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    )
  }

  if (!spec) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load API documentation</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">LuxonAI API Documentation</h1>
          <p className="mt-2 text-indigo-100">
            Comprehensive REST API for intelligent contact management
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <SwaggerUI 
          spec={spec}
          docExpansion="list"
          deepLinking={true}
          defaultModelsExpandDepth={2}
          tryItOutEnabled={true}
          requestInterceptor={(request) => {
            // Add any default headers or authentication here
            return request
          }}
        />
      </div>
    </div>
  )
}