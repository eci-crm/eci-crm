import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, provider, apiKey, baseUrl, model } = body

    if (action === 'test') {
      if (!apiKey || !baseUrl) {
        return NextResponse.json(
          { error: 'API Key and Base URL are required' },
          { status: 400 }
        )
      }

      // Test the AI connection by making a simple chat completion request
      const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      }

      const testMessages = [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with exactly: "Connection test successful"'
        },
        {
          role: 'user',
          content: 'Test connection'
        }
      ]

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: model || 'glm-4.5-flash',
            messages: testMessages,
            max_tokens: 50,
            temperature: 0.1,
            thinking: { type: 'disabled' },
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          let errorMsg = `API returned status ${response.status}`
          try {
            const errorData = await response.json()
            if (errorData.error?.message) {
              errorMsg = errorData.error.message
            } else if (errorData.message) {
              errorMsg = errorData.message
            } else if (typeof errorData.error === 'string') {
              errorMsg = errorData.error
            }
          } catch {
            try {
              errorMsg = await response.text()
            } catch {
              // Use default error message
            }
          }
          return NextResponse.json(
            { error: `Connection failed: ${errorMsg}` },
            { status: 400 }
          )
        }

        const data = await response.json()
        
        if (data.choices && data.choices.length > 0) {
          const content = data.choices[0]?.message?.content || ''
          return NextResponse.json({
            success: true,
            message: `Connected successfully! Model: ${data.model || model || 'unknown'}, Response: "${content.slice(0, 100)}"`,
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Connection established but received unexpected response format',
        })
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId)
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return NextResponse.json(
            { error: 'Connection timed out after 30 seconds. Please check your Base URL.' },
            { status: 408 }
          )
        }
        
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
        return NextResponse.json(
          { error: `Connection failed: ${errorMessage}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('AI config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
