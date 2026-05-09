import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function GET() {
  try {
    const messages = await db.chatMessage.findMany({
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Save user message
    await db.chatMessage.create({
      data: {
        role: 'user',
        content: message,
      },
    })

    // Get recent conversation context
    const recentMessages = await db.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const conversationHistory = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

    // Use z-ai-web-dev-sdk LLM
    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      model: 'glm-4-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are a CRM assistant for CRM Pro. Help with client management, proposals, business tracking, and reports. Be concise and helpful.',
        },
        ...conversationHistory,
      ],
    })

    const assistantContent = response.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.'

    // Save assistant response
    const assistantMessage = await db.chatMessage.create({
      data: {
        role: 'assistant',
        content: assistantContent,
      },
    })

    return NextResponse.json(assistantMessage)
  } catch (error) {
    console.error('Error in chat:', error)
    // Return a fallback response so the UI doesn't break
    const fallbackMessage = await db.chatMessage.create({
      data: {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again later.',
      },
    })
    return NextResponse.json(fallbackMessage)
  }
}
