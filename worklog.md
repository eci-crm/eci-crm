---
Task ID: 1-5
Agent: main
Task: Add AI Configuration feature to ECI CRM Settings

Work Log:
- Added AIConfigTab component to settings.tsx with full AI provider configuration UI
- Created /api/ai-config route for testing AI connections
- Modified /api/chat route to read AI config from database settings as Priority 0
- Updated chatbot widget to show AI connection status (Connected/No AI Key)
- Added "Configure AI" button in chatbot when no API key is set
- Tested full workflow: save settings → verify retrieval → API working

Stage Summary:
- New AI Configuration tab in Settings with: provider selector (GLM/OpenAI/DeepSeek/Custom), API key input with show/hide, base URL, model name, test connection button, enable/disable toggle
- Chat API now reads user's API key from database first (Priority 0) before falling back to env vars
- Chatbot shows real-time AI status (green WiFi icon when configured, amber WiFiOff when not)
- AI settings stored as: ai_provider, ai_api_key, ai_base_url, ai_model, ai_enabled
- All lint checks pass cleanly
