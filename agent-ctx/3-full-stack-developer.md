# Task 3: Modify chat API route to read AI config from database settings first

## Summary
Added Priority 0 to the chat API route (`/src/app/api/chat/route.ts`) that reads AI configuration (api_key, base_url, model, enabled) from the database `settings` table before falling back to environment variables.

## Changes Made

### File: `/home/z/my-project/src/app/api/chat/route.ts`

1. **Updated priority comment block** (lines 824-828): Added "Priority 0: Database settings" to the comment list.

2. **Moved shared utilities before Priority 0** (lines 831-847): Moved `messages` array, `LLM_TIMEOUT_MS` constant, and `withTimeout` helper function from after Priority 0 to before it, since Priority 0 references these.

3. **Added Priority 0 block** (lines 849-900): 
   - Reads `ai_provider`, `ai_api_key`, `ai_base_url`, `ai_model`, `ai_enabled` from the `settings` variable (already fetched from DB earlier in the handler)
   - If `dbAiApiKey` and `dbAiBaseUrl` are present and `ai_enabled !== 'false'`, makes a direct fetch to `{baseUrl}/chat/completions`
   - Uses Bearer token auth with the DB-stored API key
   - Optionally includes `model` in the request body if configured
   - Sets `assistantContent` on success, causing Priority 1-3 to be skipped
   - Logs skip reasons: missing API key, or AI disabled

## Verification
- `bun run lint` passes cleanly
- Dev server running without errors
- Work log appended to `/home/z/my-project/worklog.md`
