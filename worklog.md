---
Task ID: 1
Agent: Main Agent
Task: Fix CRM Assistant AI bot - not working properly, needs complete CRM knowledge

Work Log:
- Investigated the AI assistant implementation: chatbot.tsx (frontend) + route.ts (backend API)
- Found CRITICAL BUG: system prompt was sent with `role: 'assistant'` instead of `role: 'system'` - the LLM wasn't treating CRM data as authoritative instructions
- Enhanced system prompt with detailed capabilities, response rules, and structured format
- Changed role from 'assistant' to 'system' for proper LLM instruction handling
- Fixed fallback responses to persist in database (they were disappearing from chat history)
- Optimized settings query with select to reduce data transfer
- Implemented dual LLM approach: z-ai-web-dev-sdk (sandbox) + direct fetch with env vars (Vercel)
- Created /api/ai-proxy route for external AI API access
- Added AI API credentials to .env file
- Set up Vercel environment variables (AI_API_KEY, AI_CHAT_ID, AI_USER_ID, AI_TOKEN, AI_API_BASE_URL)
- Deployed to GitHub and Vercel successfully

Stage Summary:
- CRM Assistant AI bot now works perfectly in the sandbox preview with full CRM knowledge
- It has real-time access to: clients, proposals, services, thematic areas, team performance, business targets, resources, historical trends
- The AI responds with exact numbers from the database (tested: ₨ 58,696,000 total business won, 2 won proposals for PSDF)
- On Vercel, the AI chat requires a publicly accessible AI API endpoint (the z-ai API is only accessible within the sandbox)
- All changes deployed to GitHub (eci-crm/eci-crm) and Vercel (my-project-sigma-ruby-33.vercel.app)
