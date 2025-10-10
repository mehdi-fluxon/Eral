import { Agent, tool } from '@openai/agents'
import { z } from 'zod'
import { executeFunction } from '../functions'

export const updateAgent = new Agent({
  name: 'Update Agent',
  handoffDescription: 'Specialist for updating contact information like email, job title, phone, company associations',
  instructions: `You update contact information fields and manage company associations. You will receive a contact ID that has been resolved.

CRITICAL RULES - PARTIAL UPDATES ONLY:
1. ONLY include the specific field(s) the user wants to change
2. NEVER pass other fields even if you know their values from previous searches
3. Examples of correct behavior:
   - "update John's title to CEO" → ONLY pass: { id, jobTitle: "CEO" }
   - "set Sarah's company to Acme" → ONLY pass: { id, companyIds: ["acme-id"] }
   - "change Mike's email to new@email.com" → ONLY pass: { id, email: "new@email.com" }
4. Require EXACTLY ONE contact ID
5. When passing string values, use PLAIN TEXT - NEVER wrap in slashes, quotes, or delimiters
   - CORRECT: "Founder & CEO"
   - WRONG: "/Founder & CEO/" or "\\"Founder & CEO\\""
6. Confirm changes clearly: "Updated [contact name]'s [field] to [value]"

COMPANY MANAGEMENT:
- Use add_company_to_contact to ADD a company WITHOUT removing existing ones
- Use update_contact_companies to REPLACE all companies with a new list
- Router will pass you instructions on which operation to perform

Fields you can update:
- name, firstName, lastName
- email, jobTitle, linkedinUrl, referrer
- companyIds (array of company IDs) - for replacing all companies
- teamMemberIds (array of team member IDs)
- cadence (follow-up frequency)
- generalNotes

NEVER EVER:
- Update multiple contacts at once
- Include fields the user didn't ask to change
- Log interactions (hand to Interaction Agent)
- Set reminders (hand to Reminder Agent)
- Wrap values in delimiters like slashes or quotes

Context you'll receive:
- Contact ID (from router/search)
- Company IDs if user mentions company names (router will search companies first)
- Specific operation to perform for company management`,

  tools: [
    tool({
      name: 'update_contact',
      description: 'Update specific contact fields - ONLY include fields user wants to change',
      parameters: z.object({
        id: z.string().describe('Contact ID'),
        name: z.string().nullable().optional().describe('Full name'),
        firstName: z.string().nullable().optional().describe('First name'),
        lastName: z.string().nullable().optional().describe('Last name'),
        email: z.string().email().nullable().optional().describe('Email address'),
        jobTitle: z.string().nullable().optional().describe('Job title'),
        linkedinUrl: z.string().nullable().optional().describe('LinkedIn profile URL'),
        referrer: z.string().nullable().optional().describe('Who referred this contact'),
        companyIds: z.array(z.string()).nullable().optional().describe('Array of company IDs to associate - only include if explicitly changing companies'),
        teamMemberIds: z.array(z.string()).nullable().optional().describe('Array of team member IDs to associate - only include if explicitly changing team members'),
        cadence: z.enum(['1_DAY', '2_DAYS', '3_DAYS', '5_DAYS', '7_DAYS', '2_WEEKS', '3_WEEKS', '1_MONTH', '2_MONTHS', '3_MONTHS', '6_MONTHS', '9_MONTHS', '12_MONTHS', '18_MONTHS', '24_MONTHS']).nullable().optional().describe('Follow-up cadence'),
        generalNotes: z.string().nullable().optional().describe('General notes about the contact')
      }),
      execute: async (args: any) => executeFunction('update_contact', args)
    }),

    tool({
      name: 'add_company_to_contact',
      description: 'Add a company to a contact WITHOUT removing existing companies',
      parameters: z.object({
        contactId: z.string().describe('Contact ID'),
        companyId: z.string().describe('Company ID to add')
      }),
      execute: async (args: any) => executeFunction('add_company_to_contact', args)
    }),

    tool({
      name: 'update_contact_companies',
      description: 'Replace ALL companies for a contact with the provided list',
      parameters: z.object({
        contactId: z.string().describe('Contact ID'),
        companyIds: z.array(z.string()).describe('Array of company IDs to replace existing companies')
      }),
      execute: async (args: any) => executeFunction('update_contact_companies', args)
    })
  ]
})
