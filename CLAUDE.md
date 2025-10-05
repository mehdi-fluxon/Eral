# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LuxonAI is a professional contact relationship management (CRM) system with an AI-powered assistant. It helps users maintain and nurture professional relationships through automated follow-up reminders, interaction tracking, and natural language queries.

**Tech Stack:**
- Next.js 15 (App Router) with TypeScript
- MySQL database with Prisma ORM
- OpenAI Agents SDK for AI assistant (`@openai/agents`)
- NextAuth v5 for authentication
- Slack integration via Bolt SDK
- Tailwind CSS 4

## Development Commands

```bash
# Development
npm run dev                    # Start dev server with Turbopack
npm run build                  # Build for production (runs migrations + generate + build)
npm start                      # Start production server

# Database
npx prisma migrate dev         # Create and apply migration
npx prisma generate            # Regenerate Prisma client
npx prisma studio              # Open database GUI
npx prisma migrate deploy      # Apply migrations in production
# NOTE: NEVER use 'prisma migrate reset' or drop the database

# Data Management
npm run import:pipedrive       # Import contacts from Pipedrive
npm run clear:data             # Clear all data (script)

# Testing
npm run test:e2e              # Run Playwright E2E tests
npm run test:e2e:ui           # Run Playwright with UI
```

## Architecture

### Core Contact Management Flow

1. **Cadence System** (`lib/cadence.ts`):
   - Contacts have a configurable follow-up cadence (1 day to 24 months)
   - `lastTouchDate` + cadence = `nextReminderDate`
   - When interactions are logged, `lastTouchDate` updates and `nextReminderDate` recalculates automatically
   - Reminder statuses: OVERDUE, DUE_TODAY, DUE_THIS_WEEK, DUE_THIS_MONTH, UPCOMING, NO_REMINDER

2. **Data Model** (see `prisma/schema.prisma`):
   - **Contact**: Core entity with firstName/lastName, email, jobTitle, cadence, reminder dates
   - **Company**: Many-to-many with Contact via `ContactCompany` join table
   - **TeamMember**: Users who own contacts, many-to-many via `ContactTeamMember`
   - **Label**: Tags for contacts (e.g., "VIP", "Hot Lead"), many-to-many via `ContactLabel`
   - **Interaction**: Logs of communications (calls, emails, meetings) with date, type, content, outcome
   - **FollowUp**: Planned follow-up tasks with status tracking

3. **Performance Optimizations**:
   - Database indexes on `nextReminderDate`, `email`, `name`, `lastName`, `jobTitle`
   - FULLTEXT search index on `name`, `email`, `jobTitle` for fast searches
   - Pagination with 50 items per page default
   - Optimized for 1000+ contacts

### AI Assistant Architecture

**Location**: `ai-assistant/` directory

The AI assistant uses OpenAI's Agents SDK (function calling) to provide natural language interface:

1. **Agent Definition** (`ai-assistant/assistant.ts`):
   - Singleton `LuxonAIAssistant` class with per-user conversation history
   - Model: gpt-4o-mini
   - Instructions emphasize autonomous behavior (search first, never ask for IDs)
   - Passes current date and teamMemberId in context

2. **Tool Functions** (`ai-assistant/functions.ts`):
   - `executeFunction()`: Dispatches to API endpoints
   - Tools mirror API endpoints: `search_contacts`, `create_contact`, `update_contact`, `add_interaction_to_contact`, `search_companies`, `get_labels`, etc.
   - Uses Zod schemas for parameter validation
   - All API calls include auth headers from context

3. **Key AI Behaviors**:
   - Searches by name first, shows options if multiple matches
   - For temporal phrases ("yesterday", "2 days ago"), calculates actual date from context
   - For label searches: calls `get_labels()` → finds label ID → uses in `search_contacts(label=ID)`
   - Auto-assigns new contacts to current user's teamMemberId
   - ALWAYS fetches fresh team member IDs before creating interactions/notes

4. **API Endpoint** (`app/api/ai-agent/route.ts`):
   - POST endpoint accepts `{ message, threadId }`
   - Returns `{ success, response, threadId, status }`
   - Logs conversations to `ai_conversations.log`

### API Structure

**Location**: `app/api/`

RESTful API routes following Next.js 15 App Router conventions:
- `GET /api/contacts` - List with filters (search, teamMember, cadence, company, label, reminderStatus, startDate, endDate)
- `POST /api/contacts` - Create contact
- `GET /api/contacts/[id]` - Get single contact
- `PATCH /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact
- `POST /api/contacts/[id]/interactions` - Add interaction (auto-updates lastTouchDate)
- `GET /api/contacts/[id]/timeline` - Get interaction history
- Similar patterns for `/api/companies`, `/api/team-members`, `/api/labels`

**API Documentation**: Auto-generated Swagger docs at `/api-docs` using `lib/swagger.ts`

### Authentication

- NextAuth v5 with Google OAuth provider
- Prisma adapter for session storage
- Auth config in `auth.ts` and `middleware.ts`
- Protected routes require authentication

### Integrations

1. **Slack Integration** (`lib/slack-client.ts`):
   - Slash commands and events handling
   - Can create contacts, log interactions from Slack
   - Fetches user emails via Slack API for team member ID lookup

2. **Pipedrive Import** (`scripts/import-pipedrive.ts`):
   - Imports contacts and companies from Pipedrive CRM
   - Maps Pipedrive fields to LuxonAI schema
   - Handles labels via join tables

## Important Conventions

### Database Migrations

- **NEVER EVER DROP OR RESET THE DATABASE** - Not in production, not in staging, not even in local development
- **NEVER** use `prisma migrate reset` or `DROP DATABASE` commands under any circumstances
- **NEVER** modify existing migrations after they're applied
- For production, use idempotent SQL when adding indexes/constraints
- Example pattern for safe migrations:
  ```sql
  SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE ...);
  SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE ...', 'SELECT ''Already exists''');
  PREPARE stmt FROM @sqlstmt;
  EXECUTE stmt;
  ```
- After failed migrations, use `npx prisma migrate resolve --applied <migration_name>`
- If a migration needs to be fixed, create a new migration to correct it - never reset

### AI Agent Instructions

When modifying AI assistant behavior (`ai-assistant/assistant.ts`):
- Instructions are in the `Agent` constructor
- Critical sections are numbered (1-13)
- Keep instructions concise and imperative
- Test with various natural language queries

### Frontend Patterns

- **Client Components**: Use `'use client'` directive
- **State Management**: React hooks (no global state library)
- **Forms**: Inline forms with modals (see `app/components/ContactForm.tsx`)
- **Filtering**: URL params for shareable state, local state for UI
- **Toast Notifications**: Custom hook in `app/hooks/useToast.ts`

### Contact List Filtering

The main contact list (`app/components/ContactList.tsx`) supports filtering by:
- Free-text search (name, email, jobTitle, company, team member)
- Team member (dropdown)
- Cadence (dropdown)
- Company (dropdown)
- Label (dropdown)
- Reminder status (dropdown)
- Date ranges (via reminderFilter prop from dashboard cards)

All filters work together with AND logic.

## Key Files

- `prisma/schema.prisma` - Database schema (source of truth)
- `lib/cadence.ts` - Reminder calculation logic
- `lib/prisma.ts` - Prisma client singleton
- `ai-assistant/assistant.ts` - AI agent configuration
- `ai-assistant/functions.ts` - AI tool definitions and API integration
- `app/components/ContactList.tsx` - Main contact management UI
- `app/api/contacts/route.ts` - Contact CRUD API

## Environment Variables

Required in `.env`:
```
DATABASE_URL="mysql://root:@localhost:3306/luxonai"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
OPENAI_API_KEY="..."
```

Optional:
```
SLACK_BOT_TOKEN="..."
SLACK_SIGNING_SECRET="..."
PIPEDRIVE_API_TOKEN="..."
PIPEDRIVE_COMPANY_DOMAIN="..."
```
