import { NextRequest, NextResponse } from 'next/server'

/**
 * AI Proxy Route
 * Proxies requests to the z-ai API service.
 * This allows external deployments (Vercel) to access the AI API through the sandbox.
 *
 * Usage: POST /api/ai-proxy with the same body as /v1/chat/completions
 * The API key, chat ID, token, and user ID are injected from environment variables.
 */

const ZAI_BASE_URL = process.env.AI_PROXY_TARGET_URL || process.env.AI_API_BASE_URL || ''

export async function POST(request: NextRequest) {
  try {
    if (!ZAI_BASE_URL) {
      return NextResponse.json(
        { error: 'AI proxy target URL not configured. Set AI_PROXY_TARGET_URL or AI_API_BASE_URL env var.' },
        { status: 503 }
      )
    }

    const body = await request.json()

    // Build headers with credentials from environment variables
    const aiApiKey = process.env.AI_API_KEY
    if (!aiApiKey) {
      return NextResponse.json(
        { error: 'AI API key not configured. Set AI_API_KEY env var.' },
        { status: 503 }
      )
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiApiKey}`,
      'X-Z-AI-From': 'Z',
    }

    if (process.env.AI_CHAT_ID) headers['X-Chat-Id'] = process.env.AI_CHAT_ID
    if (process.env.AI_USER_ID) headers['X-User-Id'] = process.env.AI_USER_ID
    if (process.env.AI_TOKEN) headers['X-Token'] = process.env.AI_TOKEN

    // Forward to z-ai API
    const response = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...body,
        thinking: body.thinking || { type: 'disabled' },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`AI proxy request failed: ${response.status}`, errorBody)
      return NextResponse.json(
        { error: `AI API returned ${response.status}`, details: errorBody },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('AI proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to reach AI API' },
      { status: 502 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
