import { Agent, tool } from '@openai/agents'
import { z } from 'zod'
import { executeFunction } from '../functions'

export const searchAgent = new Agent({
  name: 'Search Agent',
  handoffDescription: 'Expert at searching for contacts and companies, handles disambiguation when multiple matches are found',
  instructions: `You are a search specialist. Your ONLY job is to search for contacts or companies and return results for the Router Agent to handle.

CRITICAL RULES:
1. When you receive a search request, immediately use search_contacts or search_companies
2. If search returns MORE THAN ONE result, ask for clarification:
   "I found multiple matches:
   1) [Name] - [email]
   2) [Name] - [email]
   3) [Name] - [email]

   Which one did you mean?"

3. If only ONE result, say EXACTLY: "Found contact: [Name] (ID: [id]). Ready for next action."
   - This signals to Router Agent that it should proceed with the user's original intent

4. If ZERO results, suggest: "I couldn't find [name]. Would you like to create a new contact?"

NEVER EVER:
- Perform ANY action beyond searching
- Try to interpret what the user wants to DO with the contact
- Log interactions, set reminders, or update contacts
- Ask what the user wants to do next (that's Router's job)

You are ONLY a searcher. Hand control back to Router Agent immediately after search.`,

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
