import { Agent, tool } from '@openai/agents'
import { z } from 'zod'
import { executeFunction } from '../functions'

export const searchAgent = new Agent({
  name: 'Search Agent',
  handoffDescription: 'Expert at searching for contacts and companies, handles disambiguation when multiple matches are found',
  instructions: `You are a search specialist. Your ONLY job is to search for contacts or companies and ensure disambiguation.

CRITICAL RULES:
1. When you receive a search request, immediately use search_contacts or search_companies
2. If search returns MORE THAN ONE result, STOP immediately and DO NOT proceed
3. Present results as a numbered list with full details:
   "I found multiple matches:
   1) [Name] - [email] ([Company])
   2) [Name] - [email] ([Company])
   3) [Name] - [email] ([Company])

   Which one did you mean?"
4. If only ONE result, return the contact/company details clearly
5. If ZERO results, suggest: "I couldn't find [name]. Would you like to create a new contact?"

NEVER EVER:
- Update contacts
- Log interactions or notes
- Set reminders
- Create contacts without asking first
- Proceed with operations when multiple matches exist

Your response should help the router agent decide next steps.`,

  tools: [
    tool({
      name: 'search_contacts',
      description: 'Search for contacts by name, email, job title, company, or team member',
      parameters: z.object({
        search: z.string().describe('Search term for name, email, job title, etc'),
        teamMember: z.string().nullable().optional().describe('Filter by team member ID'),
        company: z.string().nullable().optional().describe('Filter by company ID'),
        label: z.string().nullable().optional().describe('Filter by label ID'),
        limit: z.number().default(100).describe('Max results to return')
      }),
      execute: async (args: any) => executeFunction('search_contacts', args)
    }),

    tool({
      name: 'search_companies',
      description: 'Search for companies by name',
      parameters: z.object({
        search: z.string().describe('Company name to search for'),
        limit: z.number().default(100).describe('Max results to return')
      }),
      execute: async (args: any) => executeFunction('search_companies', args)
    }),

    tool({
      name: 'get_contact_by_id',
      description: 'Get full details of a specific contact after disambiguation',
      parameters: z.object({
        id: z.string().describe('Contact ID')
      }),
      execute: async (args: any) => executeFunction('get_contact_by_id', args)
    })
  ]
})
