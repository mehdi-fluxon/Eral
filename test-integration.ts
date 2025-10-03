import * as dotenv from 'dotenv'
dotenv.config()

import { luxonAIAssistant } from './ai-assistant/assistant'

async function runTests() {
  console.log('🧪 Running Integration Tests for Agents SDK\n')
  console.log('=' .repeat(60))

  // Test 1: Simple greeting
  console.log('\n📝 Test 1: Simple Greeting')
  console.log('-'.repeat(60))
  try {
    const result1 = await luxonAIAssistant.processMessage('Hello!', "test-user")
    console.log('✅ Response:', result1.response)
  } catch (error) {
    console.error('❌ Error:', error)
  }

  // Test 2: Get follow-ups for the week
  console.log('\n📝 Test 2: Get Follow-ups for This Week')
  console.log('-'.repeat(60))
  try {
    const result2 = await luxonAIAssistant.processMessage(
      'What are my follow-ups for this week?',
      'cmg8d03pm0002itefe6e8yw5s' // Team member ID from logs
    )
    console.log('✅ Response:', result2.response.substring(0, 500) + '...')
  } catch (error) {
    console.error('❌ Error:', error)
  }

  // Test 3: Add a new contact
  console.log('\n📝 Test 3: Add New Contact')
  console.log('-'.repeat(60))
  try {
    const result3 = await luxonAIAssistant.processMessage(
      'Add a new contact named Sarah Johnson with email sarah.johnson@example.com',
      'cmg8d03pm0002itefe6e8yw5s'
    )
    console.log('✅ Response:', result3.response)
  } catch (error) {
    console.error('❌ Error:', error)
  }

  // Test 4: Search for a contact
  console.log('\n📝 Test 4: Search for Contact')
  console.log('-'.repeat(60))
  try {
    const result4 = await luxonAIAssistant.processMessage(
      'Search for Sarah Johnson',
      'cmg8d03pm0002itefe6e8yw5s'
    )
    console.log('✅ Response:', result4.response)
  } catch (error) {
    console.error('❌ Error:', error)
  }

  // Test 5: Get dashboard stats
  console.log('\n📝 Test 5: Dashboard Statistics')
  console.log('-'.repeat(60))
  try {
    const result5 = await luxonAIAssistant.processMessage(
      'Show me my dashboard stats',
      'cmg8d03pm0002itefe6e8yw5s'
    )
    console.log('✅ Response:', result5.response)
  } catch (error) {
    console.error('❌ Error:', error)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ All tests completed!')
}

runTests().catch(console.error)
