# AI Assistant - Essential Files Only

This directory contains only the essential files needed for the AI agent to function.

## Essential Runtime Files (3 files)

### 1. `assistant.ts` ✅ REQUIRED
- Core OpenAI Assistant logic
- Manages threads, messages, and function execution
- Used by: `/app/api/ai-agent/route.ts`

### 2. `functions.ts` ✅ REQUIRED
- Maps AI function calls to actual API endpoints
- Contains `executeFunction()` for API calls
- Contains `generateOpenAIFunctions()` for function definitions
- Used by: `assistant.ts` and `create-assistant.ts`

### 3. `create-assistant.ts` ⚠️ SETUP ONLY
- Used to create/recreate the OpenAI Assistant
- Run once when setting up or updating functions
- Not needed for runtime
- Command: `npx tsx ai-assistant/create-assistant.ts`

## Documentation Files (2 files)

### 4. `FUNCTION_MAPPING.md` 📚 REFERENCE
- Complete reference of all 19 function mappings
- Explains how functions map to API endpoints
- Useful for development and troubleshooting

### 5. `README.md` 📚 THIS FILE
- Overview of the directory structure

## What Was Removed

❌ `test-assistant.ts` - Testing utility, not needed for production  
❌ `api-documentation.md` - Reference doc, kept in FUNCTION_MAPPING.md  
❌ `api/route.ts` - Duplicate, real one is in `/app/api/ai-agent/`  
❌ `ui/page.tsx` - UI component, optional  

## How It Works

1. **User Request** → API endpoint `/app/api/ai-agent/route.ts`
2. **Assistant** → `assistant.ts` processes the request via OpenAI
3. **Function Call** → OpenAI decides to call a function (e.g., `search_contacts`)
4. **Execution** → `functions.ts` maps function to API call
5. **Response** → Returns data to OpenAI, which formats response

## File Dependencies

```
/app/api/ai-agent/route.ts
    ↓
assistant.ts
    ↓
functions.ts
    ↓
Your API endpoints (/app/api/contacts, etc.)
```

## Required Environment Variables

```env
OPENAI_API_KEY="sk-..."
OPENAI_ASSISTANT_ID="asst_..."
```

## Setup New Assistant

When you need to recreate the assistant (e.g., after modifying functions):

```bash
npx tsx ai-assistant/create-assistant.ts
# Copy the new assistant ID to .env
```

## Total Files: 5
- **Runtime Essential**: 2 files (`assistant.ts`, `functions.ts`)
- **Setup Tool**: 1 file (`create-assistant.ts`)
- **Documentation**: 2 files (`FUNCTION_MAPPING.md`, `README.md`)