#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import { calculateNextReminderDate } from '../lib/cadence'

const prisma = new PrismaClient()

// CLI Arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10

// Environment variables
const PIPEDRIVE_API_KEY = process.env.PIPEDRIVE_API_KEY
const PIPEDRIVE_DOMAIN = process.env.PIPEDRIVE_DOMAIN

if (!PIPEDRIVE_API_KEY || !PIPEDRIVE_DOMAIN) {
  console.error('❌ Missing required environment variables:')
  console.error('   PIPEDRIVE_API_KEY')
  console.error('   PIPEDRIVE_DOMAIN')
  process.exit(1)
}

// Types
interface PipedriveUser {
  id: number
  name: string
  email: string
  active_flag: boolean
}

interface PipedriveOrg {
  value: number
  name: string
  owner_id: number
}

interface PipedrivePerson {
  id: number
  name: string
  first_name: string
  last_name: string
  email: Array<{ value: string; primary: boolean }>
  phone: Array<{ value: string; primary: boolean }>
  job_title: string | null
  org_id: PipedriveOrg | null
  owner_id: PipedriveUser
  add_time: string
  update_time: string
  last_activity_date: string | null
  last_outgoing_mail_time: string | null
  label_ids: number[]
  company_id: number
  [key: string]: any // For custom field hashes
}

interface PipedriveActivity {
  id: number
  type: string
  subject: string
  note: string | null
  done: boolean
  due_date: string
  person_id: number
  user_id: number
}

interface PipedriveLabel {
  id: number
  label: string
  color: string
}

interface Stats {
  labels: { created: number; skipped: number; errors: number }
  teamMembers: { created: number; skipped: number; errors: number }
  companies: { created: number; skipped: number; errors: number }
  contacts: { created: number; skipped: number; errors: number }
  interactions: { created: number; skipped: number; errors: number }
}

// Rate limiting state
let dailyTokensRemaining: number | null = null
let burstTokensRemaining: number | null = null
let requestCount = 0
const MIN_DELAY_MS = 500 // 250ms between requests for burst protection (4 req/sec max)

// Helpers
function log(icon: string, message: string) {
  console.log(`${icon} ${message}`)
}

function parsePipedriveDate(dateStr: string | null): Date | null {
  if (!dateStr) return null
  // Format: "2022-12-19 14:33:53"
  return new Date(dateStr.replace(' ', 'T') + 'Z')
}

function getLatestDate(...dates: (Date | null)[]): Date {
  const validDates = dates.filter(d => d !== null) as Date[]
  if (validDates.length === 0) return new Date()
  return new Date(Math.max(...validDates.map(d => d.getTime())))
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchPipedrive(endpoint: string): Promise<any> {
  // Rate limit protection: add delay between requests
  if (requestCount > 0) {
    await sleep(MIN_DELAY_MS)
  }

  const url = `https://${PIPEDRIVE_DOMAIN}/api/v1${endpoint}`
  const separator = endpoint.includes('?') ? '&' : '?'
  const response = await fetch(`${url}${separator}api_token=${PIPEDRIVE_API_KEY}`)
  requestCount++

  // Parse rate limit headers
  const dailyLimit = response.headers.get('x-ratelimit-limit')
  const dailyRemaining = response.headers.get('x-ratelimit-remaining')
  const burstRemaining = response.headers.get('x-burst-ratelimit-remaining')
  const retryAfter = response.headers.get('retry-after')

  if (dailyRemaining) dailyTokensRemaining = parseInt(dailyRemaining)
  if (burstRemaining) burstTokensRemaining = parseInt(burstRemaining)

  // Log rate limit info every 10 requests
  if (requestCount % 10 === 0 && dailyRemaining && dailyLimit) {
    const percentUsed = ((parseInt(dailyLimit) - parseInt(dailyRemaining)) / parseInt(dailyLimit) * 100).toFixed(1)
    log('📊', `API tokens: ${dailyRemaining}/${dailyLimit} remaining (${percentUsed}% used)`)
  }

  // Handle rate limit errors
  if (response.status === 429) {
    const waitSeconds = retryAfter ? parseInt(retryAfter) : 60
    log('⏳', `Rate limit hit! Waiting ${waitSeconds} seconds...`)
    await sleep(waitSeconds * 1000)
    // Retry the request
    return fetchPipedrive(endpoint)
  }

  if (!response.ok) {
    throw new Error(`Pipedrive API error: ${response.status} ${response.statusText}`)
  }

  // Warn if getting close to limits
  if (dailyTokensRemaining !== null && dailyTokensRemaining < 1000) {
    log('⚠️ ', `Warning: Only ${dailyTokensRemaining} daily tokens remaining`)
  }
  if (burstTokensRemaining !== null && burstTokensRemaining < 10) {
    log('⚠️ ', `Warning: Only ${burstTokensRemaining} burst tokens remaining`)
    await sleep(2000) // Extra delay if burst limit is low
  }

  const data = await response.json()
  return data.data || []
}

// Cache for labels
const labelCache = new Map<number, string>() // pipedriveId -> labelId

// Step 0: Sync Labels from Pipedrive
async function syncLabels(stats: Stats): Promise<void> {
  try {
    log('🏷️ ', 'Fetching labels from Pipedrive...')
    const fields: any[] = await fetchPipedrive('/personFields')

    // Find the label_ids field definition
    const labelField = fields.find(f => f.key === 'label_ids')
    if (!labelField || !labelField.options) {
      log('⚠️ ', 'No labels found in Pipedrive')
      return
    }

    const pipedriveLabels: PipedriveLabel[] = labelField.options.map((opt: any) => ({
      id: opt.id,
      label: opt.label,
      color: opt.color
    }))

    log('✓', `Found ${pipedriveLabels.length} labels in Pipedrive`)

    for (const pdLabel of pipedriveLabels) {
      try {
        // Check if label exists
        const existing = await prisma.label.findUnique({
          where: { pipedriveId: pdLabel.id }
        })

        if (existing) {
          labelCache.set(pdLabel.id, existing.id)
          stats.labels.skipped++
          continue
        }

        if (dryRun) {
          log('🔍', `[DRY RUN] Would create label: ${pdLabel.label} (${pdLabel.color})`)
          stats.labels.created++
          labelCache.set(pdLabel.id, 'dry-run-id')
          continue
        }

        const label = await prisma.label.create({
          data: {
            name: pdLabel.label,
            color: pdLabel.color,
            pipedriveId: pdLabel.id
          }
        })

        labelCache.set(pdLabel.id, label.id)
        log('✅', `Created label: ${pdLabel.label}`)
        stats.labels.created++
      } catch (error) {
        log('❌', `Error creating label ${pdLabel.label}: ${error}`)
        stats.labels.errors++
      }
    }
    log('', '')
  } catch (error) {
    log('❌', `Error syncing labels: ${error}`)
  }
}

// Step 1: Create Team Members
async function createTeamMember(owner: PipedriveUser, stats: Stats): Promise<string | null> {
  if (!owner.active_flag || owner.name === '(deleted user)') {
    log('⏭️ ', `Skipping deleted/inactive user: ${owner.name}`)
    stats.teamMembers.skipped++
    return null
  }

  try {
    // Check if exists
    const existing = await prisma.teamMember.findFirst({
      where: { email: owner.email }
    })

    if (existing) {
      log('⏭️ ', `Team member exists: ${owner.name} (${owner.email})`)
      stats.teamMembers.skipped++
      return existing.id
    }

    if (dryRun) {
      log('🔍', `[DRY RUN] Would create team member: ${owner.name} (${owner.email})`)
      stats.teamMembers.created++
      return 'dry-run-id'
    }

    const member = await prisma.teamMember.create({
      data: {
        name: owner.name,
        email: owner.email,
        // Note: customFields not in schema, storing pipedrive ID in a future enhancement
      }
    })

    log('✅', `Created team member: ${owner.name}`)
    stats.teamMembers.created++
    return member.id
  } catch (error) {
    log('❌', `Error creating team member ${owner.name}: ${error}`)
    stats.teamMembers.errors++
    return null
  }
}

// Step 2: Create Companies
async function createCompany(org: PipedriveOrg, stats: Stats): Promise<string | null> {
  try {
    // Check if exists (case-insensitive - MySQL doesn't support mode)
    const existing = await prisma.company.findFirst({
      where: {
        name: org.name
      }
    })

    if (existing) {
      log('⏭️ ', `Company exists: ${org.name}`)
      stats.companies.skipped++
      return existing.id
    }

    if (dryRun) {
      log('🔍', `[DRY RUN] Would create company: ${org.name}`)
      stats.companies.created++
      return 'dry-run-id'
    }

    const company = await prisma.company.create({
      data: {
        name: org.name,
        customFields: {
          pipedriveOrgId: org.value,
          pipedriveOwnerId: org.owner_id
        }
      }
    })

    log('✅', `Created company: ${org.name}`)
    stats.companies.created++
    return company.id
  } catch (error) {
    log('❌', `Error creating company ${org.name}: ${error}`)
    stats.companies.errors++
    return null
  }
}

// Step 3: Create Contacts
async function createContact(
  person: PipedrivePerson,
  teamMemberId: string | null,
  companyId: string | null,
  stats: Stats
): Promise<string | null> {
  try {
    const crmId = String(person.id)

    // Check if exists
    const existing = await prisma.contact.findFirst({
      where: { crmId }
    })

    if (existing) {
      log('⏭️ ', `Contact exists: ${person.name} (CRM ID: ${crmId})`)
      stats.contacts.skipped++
      return existing.id
    }

    // Calculate lastTouchDate
    const addTime = parsePipedriveDate(person.add_time)
    const lastActivityDate = parsePipedriveDate(person.last_activity_date)
    const lastOutgoingMailTime = parsePipedriveDate(person.last_outgoing_mail_time)
    const lastTouchDate = getLatestDate(addTime, lastActivityDate, lastOutgoingMailTime)

    // Calculate next reminder
    const cadence = '3_MONTHS'
    const nextReminderDate = calculateNextReminderDate(lastTouchDate, cadence)

    // Extract custom fields (hash keys)
    const customFields: any = {
      phone: person.phone[0]?.value || '',
      pipedriveLabels: person.label_ids,
      pipedriveCompanyId: person.company_id
    }

    // Add all custom field hashes
    Object.keys(person).forEach(key => {
      if (key.match(/^[a-f0-9]{40}$/)) {
        customFields[key] = person[key]
      }
    })

    const email = person.email[0]?.value || `noemail-${person.id}@pipedrive.import`

    if (dryRun) {
      log('🔍', `[DRY RUN] Would create contact: ${person.name} (${email})`)
      stats.contacts.created++
      return 'dry-run-id'
    }

    // Build label connections
    const labelConnections = person.label_ids
      .map(pdLabelId => labelCache.get(pdLabelId))
      .filter(labelId => labelId && labelId !== 'dry-run-id')

    const contact = await prisma.contact.create({
      data: {
        name: person.name,
        firstName: person.first_name || null,
        lastName: person.last_name || null,
        email,
        jobTitle: person.job_title || null,
        crmId,
        cadence,
        lastTouchDate,
        nextReminderDate,
        customFields,
        companies: companyId ? {
          create: [{ companyId }]
        } : undefined,
        teamMembers: teamMemberId ? {
          create: [{ teamMemberId }]
        } : undefined,
        labels: labelConnections.length > 0 ? {
          create: labelConnections.map(labelId => ({ labelId: labelId as string }))
        } : undefined
      }
    })

    log('✅', `Created contact: ${person.name}${labelConnections.length > 0 ? ` (${labelConnections.length} labels)` : ''}`)
    stats.contacts.created++
    return contact.id
  } catch (error) {
    log('❌', `Error creating contact ${person.name}: ${error}`)
    stats.contacts.errors++
    return null
  }
}

// Step 4: Create Interactions
async function createInteraction(
  activity: PipedriveActivity,
  contactId: string,
  teamMemberId: string,
  stats: Stats
): Promise<void> {
  try {
    // Check if exists - MySQL JSON query requires string_contains approach
    const existing = await prisma.interaction.findFirst({
      where: {
        customFields: {
          string_contains: `"pipedriveActivityId":${activity.id}`
        }
      }
    })

    if (existing) {
      log('⏭️ ', `Interaction exists: ${activity.subject || activity.type} (ID: ${activity.id})`)
      stats.interactions.skipped++
      return
    }

    // Build content
    let content = activity.subject || ''
    if (activity.note) {
      content += content ? `\n\n${activity.note}` : activity.note
    }
    if (!content) {
      content = `${activity.type} activity`
    }

    const outcome = activity.done ? 'Completed' : 'Pending'
    const interactionDate = parsePipedriveDate(activity.due_date) || new Date()

    if (dryRun) {
      log('🔍', `[DRY RUN] Would create interaction: ${activity.subject || activity.type}`)
      stats.interactions.created++
      return
    }

    await prisma.interaction.create({
      data: {
        contactId,
        teamMemberId,
        type: activity.type,
        subject: activity.subject || null,
        content,
        outcome,
        interactionDate,
        customFields: {
          pipedriveActivityId: activity.id
        }
      }
    })

    log('✅', `Created interaction: ${activity.subject || activity.type}`)
    stats.interactions.created++
  } catch (error) {
    log('❌', `Error creating interaction ${activity.id}: ${error}`)
    stats.interactions.errors++
  }
}

// Main function
async function main() {
  log('🚀', `Starting Pipedrive import (limit: ${limit}, dry-run: ${dryRun})`)
  log('', '')

  const stats: Stats = {
    labels: { created: 0, skipped: 0, errors: 0 },
    teamMembers: { created: 0, skipped: 0, errors: 0 },
    companies: { created: 0, skipped: 0, errors: 0 },
    contacts: { created: 0, skipped: 0, errors: 0 },
    interactions: { created: 0, skipped: 0, errors: 0 }
  }

  try {
    // Step 0: Sync Labels
    await syncLabels(stats)

    // Fetch persons from Pipedrive
    log('📥', `Fetching ${limit} persons from Pipedrive...`)
    const persons: PipedrivePerson[] = await fetchPipedrive(`/persons?limit=${limit}`)
    log('✓', `Fetched ${persons.length} persons`)
    log('', '')

    // Process each person
    for (const person of persons) {
      log('👤', `Processing: ${person.name}`)

      // Step 1: Create Team Member
      let teamMemberId: string | null = null
      if (person.owner_id) {
        teamMemberId = await createTeamMember(person.owner_id, stats)
      }

      // Step 2: Create Company
      let companyId: string | null = null
      if (person.org_id) {
        companyId = await createCompany(person.org_id, stats)
      }

      // Step 3: Create Contact
      const contactId = await createContact(person, teamMemberId, companyId, stats)

      // Step 4: Fetch and create activities
      if (contactId && contactId !== 'dry-run-id' && teamMemberId && teamMemberId !== 'dry-run-id') {
        try {
          const activities: PipedriveActivity[] = await fetchPipedrive(`/persons/${person.id}/activities`)

          if (activities && activities.length > 0) {
            log('📝', `  Found ${activities.length} activities`)

            for (const activity of activities) {
              await createInteraction(activity, contactId, teamMemberId, stats)
            }
          }
        } catch (error) {
          log('⚠️ ', `  Could not fetch activities: ${error}`)
        }
      }

      log('', '')
    }

    // Print summary
    log('', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    log('📊', 'Import Summary:')
    log('', '')
    log('🏷️ ', `Labels: ${stats.labels.created} created, ${stats.labels.skipped} skipped, ${stats.labels.errors} errors`)
    log('👥', `Team Members: ${stats.teamMembers.created} created, ${stats.teamMembers.skipped} skipped, ${stats.teamMembers.errors} errors`)
    log('🏢', `Companies: ${stats.companies.created} created, ${stats.companies.skipped} skipped, ${stats.companies.errors} errors`)
    log('👤', `Contacts: ${stats.contacts.created} created, ${stats.contacts.skipped} skipped, ${stats.contacts.errors} errors`)
    log('📝', `Interactions: ${stats.interactions.created} created, ${stats.interactions.skipped} skipped, ${stats.interactions.errors} errors`)
    log('', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (dryRun) {
      log('', '')
      log('💡', 'This was a dry run. No data was actually created.')
      log('💡', 'Run without --dry-run to import for real.')
    }

  } catch (error) {
    log('❌', `Fatal error: ${error}`)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
