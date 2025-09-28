# AI Assistant Function Mapping

## Overview
This document explains how the OpenAI Assistant functions map to actual API endpoints.

## How It Works

1. **User Query** → User asks: "Show me all overdue contacts"
2. **OpenAI Decision** → OpenAI decides to call: `search_contacts({reminderStatus: "OVERDUE"})`
3. **Function Call** → Your assistant receives the function name and parameters
4. **executeFunction()** → Maps function name to actual HTTP API call
5. **API Call** → Makes `GET http://localhost:3001/api/contacts?reminderStatus=OVERDUE`
6. **Response** → Returns data back to OpenAI, which formats a response

## Complete Function → API Mapping

### Contacts (5 functions)
| Function | HTTP Method | Endpoint | Description |
|----------|-------------|----------|-------------|
| `search_contacts` | GET | `/api/contacts?{params}` | Search/list contacts with filters |
| `create_contact` | POST | `/api/contacts` | Create new contact |
| `get_contact_by_id` | GET | `/api/contacts/{id}` | Get contact by ID |
| `update_contact` | PUT | `/api/contacts/{id}` | Update contact |
| `delete_contact` | DELETE | `/api/contacts/{id}` | Delete contact |

### Notes (2 functions)
| Function | HTTP Method | Endpoint | Description |
|----------|-------------|----------|-------------|
| `add_note_to_contact` | POST | `/api/contacts/{contactId}/notes` | Add note (auto-updates lastTouchDate) |
| `delete_note` | DELETE | `/api/notes/{id}` | Delete note |

**Note:** `update_note` does NOT exist in the API.

### Interactions (3 functions)
| Function | HTTP Method | Endpoint | Description |
|----------|-------------|----------|-------------|
| `add_interaction_to_contact` | POST | `/api/contacts/{contactId}/interactions` | Log interaction (auto-updates lastTouchDate) |
| `update_interaction` | PATCH | `/api/interactions/{id}` | Update interaction |
| `delete_interaction` | DELETE | `/api/interactions/{id}` | Delete interaction |

### Companies (5 functions)
| Function | HTTP Method | Endpoint | Description |
|----------|-------------|----------|-------------|
| `search_companies` | GET | `/api/companies?{params}` | Search/list companies |
| `create_company` | POST | `/api/companies` | Create new company |
| `get_company_by_id` | GET | `/api/companies/{id}` | Get company by ID |
| `update_company` | PUT | `/api/companies/{id}` | Update company |
| `delete_company` | DELETE | `/api/companies/{id}` | Delete company |

### Team Members (2 functions)
| Function | HTTP Method | Endpoint | Description |
|----------|-------------|----------|-------------|
| `search_team_members` | GET | `/api/team-members?{params}` | Search/list team members |
| `create_team_member` | POST | `/api/team-members` | Create new team member |

**Note:** Update/delete team member functions do NOT exist in the API.

### Other (2 functions)
| Function | HTTP Method | Endpoint | Description |
|----------|-------------|----------|-------------|
| `get_contact_timeline` | GET | `/api/contacts/{contactId}/timeline` | Get notes & interactions timeline |
| `get_dashboard_stats` | GET | `/api/dashboard/stats` | Get dashboard statistics |

## Total: 19 Functions

## Key Files

### 1. `/ai-assistant/functions.ts`
Contains two main exports:

#### `executeFunction(functionName, parameters, baseUrl)`
- Maps function names to actual API calls
- Handles HTTP requests (GET, POST, PUT, PATCH, DELETE)
- Constructs URLs and request bodies
- Returns API response data

Example:
```typescript
case 'search_contacts': {
  const searchParams = new URLSearchParams()
  if (parameters.search) searchParams.append('search', parameters.search)
  // ... more params
  const response = await fetch(`${baseUrl}/api/contacts?${searchParams}`)
  return await response.json()
}
```

#### `generateOpenAIFunctions()`
- Returns array of function definitions for OpenAI
- Defines function names, descriptions, and parameters
- Used when creating the assistant

### 2. `/ai-assistant/assistant.ts`
- Manages OpenAI Assistant interactions
- Calls `executeFunction()` when OpenAI requests a function call
- Handles conversation threads and message processing

### 3. `/ai-assistant/create-assistant.ts`
- Script to create a new OpenAI Assistant
- Uses `generateOpenAIFunctions()` to register all 19 functions
- Includes comprehensive API documentation and instructions

## Adding New Functions

To add a new function:

1. **Add API endpoint** in `/app/api/...`
2. **Add function definition** in `functions.ts` → `generateOpenAIFunctions()`
   ```typescript
   functions.push({
     name: "function_name",
     description: "What it does",
     parameters: { /* schema */ }
   })
   ```
3. **Add API mapping** in `functions.ts` → `executeFunction()`
   ```typescript
   case 'function_name': {
     const response = await fetch(`${baseUrl}/api/...`)
     return await response.json()
   }
   ```
4. **Recreate assistant** by running:
   ```bash
   npx tsx ai-assistant/create-assistant.ts
   ```
5. **Update .env** with new assistant ID

## Important Notes

### Function Names vs Endpoints
- Function names describe the **intent** (e.g., `search_contacts`)
- Endpoints are the **actual paths** (e.g., `GET /api/contacts`)
- The mapping happens in `executeFunction()`

### Base URL
- Default: `http://localhost:3001`
- Override by passing `baseUrl` parameter to `executeFunction()`

### Auto-Updates
Some functions automatically update `lastTouchDate` and recalculate `nextReminderDate`:
- `add_note_to_contact` - Always updates
- `add_interaction_to_contact` - Updates if `updateLastTouch !== false`

### Parameter Transformation
Some functions transform parameters before sending to API:
- `add_interaction_to_contact` sets default `interactionDate` to today
- `add_interaction_to_contact` defaults `updateLastTouch` to `true`
- Object destructuring separates IDs from body data (e.g., `{id, ...updateData}`)

## Current Assistant ID
Check `.env` file for current `OPENAI_ASSISTANT_ID`

## Troubleshooting

### Function not working?
1. Verify API endpoint exists in `/app/api/`
2. Check function is in `executeFunction()` switch statement
3. Verify function is in `generateOpenAIFunctions()` array
4. Ensure assistant was recreated after changes
5. Check `.env` has correct assistant ID

### Testing Functions
You can test the mapping directly:
```typescript
import { executeFunction } from './ai-assistant/functions'

const result = await executeFunction('search_contacts', {
  reminderStatus: 'OVERDUE'
})
console.log(result)
```