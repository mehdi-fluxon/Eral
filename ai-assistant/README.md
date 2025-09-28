# LuxonAI Assistant

All AI assistant related code is centralized in this folder for easier maintenance.

## Structure

```
ai-assistant/
├── assistant.ts          # OpenAI Assistant wrapper (thread management, polling)
├── functions.ts          # Function schemas and execution logic
├── api/                  # API route handlers (copied to app/api/ai-agent/)
│   └── route.ts
├── ui/                   # UI components (copied to app/ai-agent/)
│   └── page.tsx
└── update-assistant.mjs  # Utility script to update assistant config
```

## Files

### `assistant.ts`
- OpenAI Assistants API wrapper
- Thread creation and management
- Run polling and completion handling
- Function calling orchestration

### `functions.ts`
- Generates OpenAI function schemas from API endpoints
- Executes function calls by routing to appropriate APIs
- Handles contact search, creation, updates, notes, dashboard stats

### `api/route.ts`
- Next.js API route for AI agent interactions
- Handles POST (send message) and GET (create thread) endpoints
- Note: This file is **copied** to `app/api/ai-agent/route.ts` for Next.js routing

### `ui/page.tsx`
- Chat interface UI component
- localStorage-based conversation persistence
- Message display and input handling
- Note: This file is **copied** to `app/ai-agent/page.tsx` for Next.js routing

### `update-assistant.mjs`
- Utility script to update assistant configuration (model, instructions, etc.)
- Run with: `node -r dotenv/config ai-assistant/update-assistant.mjs`

## Usage

### Update Assistant Configuration
```bash
node -r dotenv/config ai-assistant/update-assistant.mjs
```

### Import in Code
```typescript
import { luxonAIAssistant } from '@/ai-assistant/assistant'
import { generateOpenAIFunctions, executeFunction } from '@/ai-assistant/functions'
```

## Notes

- Next.js requires API routes to be in `app/api/` and pages in `app/`
- Source of truth files are in `ai-assistant/`, but they're copied to Next.js structure
- After editing `api/route.ts` or `ui/page.tsx`, copy them back to Next.js folders
