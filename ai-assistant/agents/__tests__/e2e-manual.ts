import { luxonAIAssistant } from '../../assistant'
import prisma from '../../../lib/prisma'

// Test constants
const TEST_USER_ID = 'test-e2e-user-' + Date.now()
const TEST_TEAM_MEMBER_ID = 'test-e2e-tm-' + Date.now()
const UNIQUE_PREFIX = 'E2ETest' + Date.now() // More unique prefix to avoid collisions

// Helper to assert conditions
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`)
  }
}

// Setup: Create test team member
async function setup() {
  console.log('\n🔧 Setting up test environment...')

  // Clean up any existing test data from previous failed runs
  try {
    // First, get all test team members
    const testTeamMembers = await prisma.teamMember.findMany({
      where: {
        email: { contains: 'e2e-test@test.com' }
      }
    })

    // For each test team member, clean up their data
    for (const tm of testTeamMembers) {
      // Delete interactions for this team member
      await prisma.interaction.deleteMany({
        where: { teamMemberId: tm.id }
      })

      // Delete contact relationships
      await prisma.contactTeamMember.deleteMany({
        where: { teamMemberId: tm.id }
      })

      // Delete the team member
      await prisma.teamMember.delete({
        where: { id: tm.id }
      })
    }

    // Delete any orphaned E2E test contacts
    await prisma.contact.deleteMany({
      where: {
        OR: [
          { name: { contains: 'E2E' } },
          { email: { contains: 'E2E' } },
          { email: { contains: '@e2e-test.com' } }
        ]
      }
    })
  } catch (e) {
    // Ignore if doesn't exist
    console.log('  ⚠️  Cleanup warning:', e)
  }

  await prisma.teamMember.create({
    data: {
      id: TEST_TEAM_MEMBER_ID,
      name: 'E2E Test User',
      email: 'e2e-test@test.com'
    }
  })
  console.log('✅ Test team member created')
}

// Cleanup: Delete all test data
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...')

  // Delete interactions
  const interactions = await prisma.interaction.findMany({
    where: { teamMemberId: TEST_TEAM_MEMBER_ID }
  })
  for (const interaction of interactions) {
    await prisma.interaction.delete({ where: { id: interaction.id } })
  }

  // Delete contact relationships
  await prisma.contactTeamMember.deleteMany({
    where: { teamMemberId: TEST_TEAM_MEMBER_ID }
  })

  // Delete contacts
  const contacts = await prisma.contact.findMany({
    where: {
      teamMembers: {
        none: {} // Contacts with no team members after deletion above
      }
    }
  })

  // Also delete contacts we created
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { name: { contains: `${UNIQUE_PREFIX}-' } },
        { email: { contains: '@${UNIQUE_PREFIX}.com` } }
      ]
    }
  })

  // Delete team member
  await prisma.teamMember.delete({
    where: { id: TEST_TEAM_MEMBER_ID }
  })

  console.log('✅ Test data cleaned up')
}

// Test 1: Disambiguation - Search Agent should ask which contact when multiple matches
async function test1_Disambiguation() {
  console.log('\n🧪 Test 1: Disambiguation (Search Agent)')
  console.log('Scenario: User says "Talked to Alex" but 3 Alexes exist')

  // Setup: Create 3 Alex contacts
  const alex1 = await prisma.contact.create({
    data: {
      name: `${UNIQUE_PREFIX}-Alex Hoff`,
      email: `alex.hoff@${UNIQUE_PREFIX}.com`,
      teamMembers: {
        create: { teamMemberId: TEST_TEAM_MEMBER_ID }
      }
    }
  })

  const alex2 = await prisma.contact.create({
    data: {
      name: `${UNIQUE_PREFIX}-Alex Braive`,
      email: `alex.braive@${UNIQUE_PREFIX}.com`,
      teamMembers: {
        create: { teamMemberId: TEST_TEAM_MEMBER_ID }
      }
    }
  })

  const alex3 = await prisma.contact.create({
    data: {
      name: `${UNIQUE_PREFIX}-Alex Badinici`,
      email: `alex.badinici@${UNIQUE_PREFIX}.com`,
      teamMembers: {
        create: { teamMemberId: TEST_TEAM_MEMBER_ID }
      }
    }
  })

  console.log('  ℹ️  Created 3 Alex contacts')

  // Execute
  const result = await luxonAIAssistant.processMessage(
    'Talked to Alex',
    TEST_USER_ID,
    TEST_TEAM_MEMBER_ID
  )

  console.log('  📤 Response:', result.response)

  // Assert: Should ask for disambiguation
  const responseLC = result.response.toLowerCase()
  assert(
    responseLC.includes('multiple') || responseLC.includes('found') || responseLC.includes('which'),
    'Response should indicate multiple matches found'
  )
  assert(
    responseLC.includes('alex'),
    'Response should mention Alex'
  )

  // Verify no interactions were logged
  const interactions = await prisma.interaction.findMany({
    where: { teamMemberId: TEST_TEAM_MEMBER_ID }
  })
  assert(interactions.length === 0, 'No interactions should be logged before disambiguation')

  console.log('  ✅ Test 1 passed: Agent correctly asks for disambiguation')
}

// Test 2: Past Interaction - Interaction Agent should log with correct date
async function test2_PastInteraction() {
  console.log('\n🧪 Test 2: Past Interaction (Interaction Agent)')
  console.log('Scenario: User says "Talked to John yesterday"')

  // Setup: Create John contact
  const john = await prisma.contact.create({
    data: {
      name: `${UNIQUE_PREFIX}-John Doe',
      email: 'john.doe@${UNIQUE_PREFIX}.com`,
      lastTouchDate: new Date('2025-09-01'), // 30+ days ago
      nextReminderDate: new Date('2025-09-15'),
      cadence: '1_MONTH',
      teamMembers: {
        create: { teamMemberId: TEST_TEAM_MEMBER_ID }
      }
    }
  })

  console.log('  ℹ️  Created John Doe contact')

  // Execute - use full unique name to avoid collisions with other Johns
  const result = await luxonAIAssistant.processMessage(
    `Talked to ${UNIQUE_PREFIX}-John Doe yesterday`,
    TEST_USER_ID,
    TEST_TEAM_MEMBER_ID
  )

  console.log('  📤 Response:', result.response)

  // Assert: Should confirm interaction logged
  const responseLC = result.response.toLowerCase()
  assert(
    responseLC.includes('log') || responseLC.includes('john') || responseLC.includes('interaction'),
    'Response should confirm interaction logged'
  )

  // Verify interaction exists with yesterday's date
  const interactions = await prisma.interaction.findMany({
    where: {
      contactId: john.id,
      teamMemberId: TEST_TEAM_MEMBER_ID
    }
  })
  assert(interactions.length > 0, 'Interaction should be logged')

  // Calculate yesterday
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const interactionDateStr = interactions[0].interactionDate.toISOString().split('T')[0]
  assert(
    interactionDateStr === yesterdayStr,
    `Interaction date should be yesterday (${yesterdayStr}), got ${interactionDateStr}`
  )

  // Verify lastTouchDate updated
  const updatedJohn = await prisma.contact.findUnique({ where: { id: john.id } })
  const lastTouchStr = updatedJohn!.lastTouchDate.toISOString().split('T')[0]
  assert(
    lastTouchStr === yesterdayStr,
    `lastTouchDate should be updated to yesterday (${yesterdayStr}), got ${lastTouchStr}`
  )

  console.log('  ✅ Test 2 passed: Interaction logged with correct date, lastTouchDate updated')
}

// Test 3: Future Reminder - Reminder Agent should set future date only
async function test3_FutureReminder() {
  console.log('\n🧪 Test 3: Future Reminder (Reminder Agent)')
  console.log('Scenario: User says "Meet Sarah on Friday"')

  // Setup: Create Sarah contact
  const sarah = await prisma.contact.create({
    data: {
      name: `${UNIQUE_PREFIX}-Sarah Smith',
      email: 'sarah.smith@${UNIQUE_PREFIX}.com`,
      lastTouchDate: new Date(),
      nextReminderDate: new Date('2025-11-01'),
      cadence: '1_MONTH',
      teamMembers: {
        create: { teamMemberId: TEST_TEAM_MEMBER_ID }
      }
    }
  })

  const originalLastTouch = sarah.lastTouchDate

  console.log('  ℹ️  Created Sarah Smith contact')

  // Execute - use full unique name
  const result = await luxonAIAssistant.processMessage(
    `Meet ${UNIQUE_PREFIX}-Sarah Smith on Friday`,
    TEST_USER_ID,
    TEST_TEAM_MEMBER_ID
  )

  console.log('  📤 Response:', result.response)

  // Assert: Should confirm reminder set
  const responseLC = result.response.toLowerCase()
  assert(
    responseLC.includes('reminder') || responseLC.includes('friday') || responseLC.includes('sarah'),
    'Response should confirm reminder set'
  )

  // Verify nextReminderDate updated to next Friday
  const updatedSarah = await prisma.contact.findUnique({ where: { id: sarah.id } })
  const nextReminder = updatedSarah!.nextReminderDate
  // Use UTC methods to avoid timezone issues
  const dayOfWeek = nextReminder.getUTCDay()
  assert(dayOfWeek === 5, `nextReminderDate should be a Friday (day 5), got day ${dayOfWeek}`)

  // Verify NO interaction logged
  const interactions = await prisma.interaction.findMany({
    where: { contactId: sarah.id }
  })
  assert(interactions.length === 0, 'NO interaction should be logged for future reminders')

  // Verify lastTouchDate UNCHANGED
  const lastTouchUnchanged = updatedSarah!.lastTouchDate.getTime() === originalLastTouch.getTime()
  assert(lastTouchUnchanged, 'lastTouchDate should NOT change for future reminders')

  console.log('  ✅ Test 3 passed: Reminder set to Friday, no interaction logged, lastTouchDate unchanged')
}

// Test 4: Compound Statement - Both Interaction and Reminder agents
async function test4_CompoundStatement() {
  console.log('\n🧪 Test 4: Compound Statement (Multi-Agent)')
  console.log('Scenario: User says "Talked to Mike, he wants to meet Friday"')

  // Setup: Create Mike contact
  const mike = await prisma.contact.create({
    data: {
      name: `${UNIQUE_PREFIX}-Mike Johnson',
      email: 'mike.johnson@${UNIQUE_PREFIX}.com`,
      lastTouchDate: new Date('2025-09-01'),
      nextReminderDate: new Date('2025-11-01'),
      cadence: '1_MONTH',
      teamMembers: {
        create: { teamMemberId: TEST_TEAM_MEMBER_ID }
      }
    }
  })

  console.log('  ℹ️  Created Mike Johnson contact')

  // Execute - use full unique name
  const result = await luxonAIAssistant.processMessage(
    `Talked to ${UNIQUE_PREFIX}-Mike Johnson, he wants to meet Friday`,
    TEST_USER_ID,
    TEST_TEAM_MEMBER_ID
  )

  console.log('  📤 Response:', result.response)

  // Assert: Should mention both interaction and reminder
  const responseLC = result.response.toLowerCase()
  assert(
    (responseLC.includes('log') || responseLC.includes('interaction')) &&
    (responseLC.includes('reminder') || responseLC.includes('friday')),
    'Response should confirm both interaction logged AND reminder set'
  )

  // Verify interaction logged
  const interactions = await prisma.interaction.findMany({
    where: { contactId: mike.id }
  })
  assert(interactions.length > 0, 'Interaction should be logged')

  // Verify nextReminderDate set to Friday
  const updatedMike = await prisma.contact.findUnique({ where: { id: mike.id } })
  const nextReminder = updatedMike!.nextReminderDate
  // Use UTC methods to avoid timezone issues
  const dayOfWeek = nextReminder.getUTCDay()
  assert(dayOfWeek === 5, `nextReminderDate should be Friday, got day ${dayOfWeek}`)

  // Verify lastTouchDate updated (from interaction)
  const today = new Date().toISOString().split('T')[0]
  const lastTouchStr = updatedMike!.lastTouchDate.toISOString().split('T')[0]
  assert(
    lastTouchStr === today,
    `lastTouchDate should be today (${today}), got ${lastTouchStr}`
  )

  console.log('  ✅ Test 4 passed: Both interaction logged AND reminder set')
}

// Test 5: Partial Update - Update Agent should only change requested field
async function test5_PartialUpdate() {
  console.log('\n🧪 Test 5: Partial Update (Update Agent)')
  console.log('Scenario: User says "Update Jane\'s title to CEO"')

  // Setup: Create Jane contact with multiple fields
  const jane = await prisma.contact.create({
    data: {
      name: `${UNIQUE_PREFIX}-Jane Williams',
      email: 'jane.williams@${UNIQUE_PREFIX}.com`,
      jobTitle: 'Manager',
      linkedinUrl: 'https://linkedin.com/in/janewilliams',
      lastTouchDate: new Date(),
      nextReminderDate: new Date('2025-11-01'),
      cadence: '1_MONTH',
      teamMembers: {
        create: { teamMemberId: TEST_TEAM_MEMBER_ID }
      }
    }
  })

  console.log('  ℹ️  Created Jane Williams (Manager)')

  // Execute - use full unique name
  const result = await luxonAIAssistant.processMessage(
    `Update ${UNIQUE_PREFIX}-Jane Williams's title to CEO`,
    TEST_USER_ID,
    TEST_TEAM_MEMBER_ID
  )

  console.log('  📤 Response:', result.response)

  // Assert: Should confirm update
  const responseLC = result.response.toLowerCase()
  assert(
    responseLC.includes('update') && responseLC.includes('ceo'),
    'Response should confirm jobTitle updated to CEO'
  )

  // Verify ONLY jobTitle changed
  const updatedJane = await prisma.contact.findUnique({ where: { id: jane.id } })
  assert(updatedJane!.jobTitle === 'CEO', 'jobTitle should be updated to CEO')
  assert(updatedJane!.email === jane.email, 'email should be UNCHANGED')
  assert(updatedJane!.name === jane.name, 'name should be UNCHANGED')
  assert(updatedJane!.linkedinUrl === jane.linkedinUrl, 'linkedinUrl should be UNCHANGED')

  console.log('  ✅ Test 5 passed: Only jobTitle updated, all other fields unchanged')
}

// Test 6: Query - Query Agent should show formatted list, no updates
async function test6_Query() {
  console.log('\n🧪 Test 6: Query (Query Agent - Read Only)')
  console.log('Scenario: User says "Show my overdue contacts"')

  // Setup: Create contacts with different reminder statuses
  const overdueDate = new Date('2025-10-01')
  const todayDate = new Date()
  const upcomingDate = new Date('2025-10-20')

  const overdue1 = await prisma.contact.create({
    data: {
      name: `${UNIQUE_PREFIX}-Overdue Person',
      email: 'overdue@${UNIQUE_PREFIX}.com`,
      nextReminderDate: overdueDate,
      lastTouchDate: new Date('2025-09-01'),
      cadence: '1_MONTH',
      teamMembers: {
        create: { teamMemberId: TEST_TEAM_MEMBER_ID }
      }
    }
  })

  const upcoming1 = await prisma.contact.create({
    data: {
      name: `${UNIQUE_PREFIX}-Upcoming Person',
      email: 'upcoming@${UNIQUE_PREFIX}.com`,
      nextReminderDate: upcomingDate,
      lastTouchDate: new Date(),
      cadence: '1_MONTH',
      teamMembers: {
        create: { teamMemberId: TEST_TEAM_MEMBER_ID }
      }
    }
  })

  console.log('  ℹ️  Created overdue and upcoming contacts')

  // Execute
  const result = await luxonAIAssistant.processMessage(
    'Show my overdue contacts',
    TEST_USER_ID,
    TEST_TEAM_MEMBER_ID
  )

  console.log('  📤 Response:', result.response)

  // Assert: Should show overdue contact
  assert(
    result.response.includes('Overdue'),
    'Response should include overdue contact name'
  )
  assert(
    !result.response.includes('Upcoming'),
    'Response should NOT include upcoming contact'
  )

  // Verify NO database changes
  const overdueCheck = await prisma.contact.findUnique({ where: { id: overdue1.id } })
  assert(
    overdueCheck!.nextReminderDate.getTime() === overdueDate.getTime(),
    'Overdue contact data should be UNCHANGED'
  )

  const upcomingCheck = await prisma.contact.findUnique({ where: { id: upcoming1.id } })
  assert(
    upcomingCheck!.nextReminderDate.getTime() === upcomingDate.getTime(),
    'Upcoming contact data should be UNCHANGED'
  )

  const interactions = await prisma.interaction.findMany({
    where: { teamMemberId: TEST_TEAM_MEMBER_ID }
  })
  assert(interactions.length === 0, 'NO interactions should be logged for queries')

  console.log('  ✅ Test 6 passed: Query returned correct data, no DB changes')
}

// Test 7: Company Conflict + Compound Statement
async function test7_CompanyConflict() {
  console.log('\n🧪 Test 7: Company Conflict + Compound Statement')
  console.log('Scenario: User says "Met with Matt from Ndea, worth pinging in 3 weeks" when Matt is already associated with Arc AGI')

  // Setup: Create Arc AGI company
  const arcCompany = await prisma.company.create({
    data: {
      name: `${UNIQUE_PREFIX}-Arc AGI`,
      website: 'https://arcagi.example.com'
    }
  })

  // Setup: Create Ndea company
  const ndeaCompany = await prisma.company.create({
    data: {
      name: `${UNIQUE_PREFIX}-Ndea`,
      website: 'https://ndea.example.com'
    }
  })

  // Setup: Create Matt contact associated with Arc AGI
  const matt = await prisma.contact.create({
    data: {
      name: `${UNIQUE_PREFIX}-Matt Wheeler`,
      email: `matt.wheeler@${UNIQUE_PREFIX}.com`,
      lastTouchDate: new Date('2025-09-01'),
      cadence: '1_MONTH',
      companies: {
        create: { companyId: arcCompany.id }
      },
      teamMembers: {
        create: { teamMemberId: TEST_TEAM_MEMBER_ID }
      }
    }
  })

  console.log(`  ℹ️  Created Matt Wheeler contact associated with ${UNIQUE_PREFIX}-Arc AGI`)

  // Execute - mention Ndea (different company) and future follow-up
  const result = await luxonAIAssistant.processMessage(
    `Met with ${UNIQUE_PREFIX}-Matt Wheeler from ${UNIQUE_PREFIX}-Ndea, worth pinging in 3 weeks`,
    TEST_USER_ID,
    TEST_TEAM_MEMBER_ID
  )

  console.log('  📤 Response:', result.response)

  // Assert: Should ask about company conflict
  const responseLC = result.response.toLowerCase()
  assert(
    responseLC.includes('arc') && (responseLC.includes('ndea') || responseLC.includes('company')),
    'Response should ask about company conflict between Arc AGI and Ndea'
  )

  // Simulate user choosing to add both companies (option 1)
  console.log('  💬 User chooses: "1" (Add Ndea)')
  const result2 = await luxonAIAssistant.processMessage(
    '1',
    TEST_USER_ID,
    TEST_TEAM_MEMBER_ID
  )

  console.log('  📤 Response 2:', result2.response)

  // Verify Matt is now associated with BOTH companies
  const updatedMatt = await prisma.contact.findUnique({
    where: { id: matt.id },
    include: {
      companies: {
        include: { company: true }
      }
    }
  })

  assert(updatedMatt!.companies.length === 2, 'Matt should be associated with 2 companies')
  const companyNames = updatedMatt!.companies.map(cc => cc.company.name)
  assert(
    companyNames.some(name => name.includes('Arc AGI')),
    'Matt should still be associated with Arc AGI'
  )
  assert(
    companyNames.some(name => name.includes('Ndea')),
    'Matt should now be associated with Ndea'
  )

  // Verify interaction logged
  const interactions = await prisma.interaction.findMany({
    where: {
      contactId: matt.id,
      teamMemberId: TEST_TEAM_MEMBER_ID
    }
  })
  assert(interactions.length > 0, 'Meeting interaction should be logged')
  assert(
    interactions[0].type === 'MEETING',
    `Interaction type should be MEETING, got ${interactions[0].type}`
  )

  // Verify reminder set for 3 weeks from now
  const today = new Date()
  const threeWeeksFromNow = new Date(today)
  threeWeeksFromNow.setDate(today.getDate() + 21)
  const threeWeeksStr = threeWeeksFromNow.toISOString().split('T')[0]

  const reminderStr = updatedMatt!.nextReminderDate!.toISOString().split('T')[0]
  assert(
    reminderStr === threeWeeksStr,
    `nextReminderDate should be 3 weeks from now (${threeWeeksStr}), got ${reminderStr}`
  )

  console.log('  ✅ Test 7 passed: Company conflict resolved, both companies added, interaction logged, reminder set')
}

// Main test runner
async function main() {
  console.log('='.repeat(60))
  console.log('🚀 E2E Tests for Multi-Agent System')
  console.log('='.repeat(60))

  try {
    await setup()

    await test1_Disambiguation()
    await test2_PastInteraction()
    await test3_FutureReminder()
    await test4_CompoundStatement()
    await test5_PartialUpdate()
    await test6_Query()
    await test7_CompanyConflict()

    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL TESTS PASSED!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ TEST FAILED')
    console.error('='.repeat(60))
    console.error(error)
    process.exit(1)
  } finally {
    await cleanup()
    await prisma.$disconnect()
  }
}

// Run tests
main()
