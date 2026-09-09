import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import type { ChatService, ConversationTurn } from '../types/chat'
import { CA_BUDDY_SYSTEM_PROMPT } from './caBuddyPrompt'
import {
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MODEL,
  validateQuestion,
  validateResponse,
} from './chatService'

export interface GeminiModelOptions {
  model: string
  apiKey: string
  maxOutputTokens: number
  temperature: number
  maxRetries: number
  streaming: boolean
}

export function createGeminiModelOptions(apiKey: string): GeminiModelOptions {
  return {
    model: GEMINI_MODEL,
    apiKey,
    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
    temperature: 0.2,
    maxRetries: 2,
    streaming: false,
  }
}

function getResponseText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') return part.text
      return ''
    })
    .join(' ')
}

export class GeminiChatService implements ChatService {
  private readonly model: ChatGoogleGenerativeAI | null
  private readonly apiKey: string

  constructor(
    apiKey = import.meta.env.VITE_GOOGLE_API_KEY ?? '',
    private readonly systemPrompt = CA_BUDDY_SYSTEM_PROMPT,
  ) {
    this.apiKey = apiKey
    this.model = apiKey ? new ChatGoogleGenerativeAI(createGeminiModelOptions(apiKey)) : null
  }

  async ask(question: string, history: ConversationTurn[]): Promise<string> {
    const validQuestion = validateQuestion(question)
    if (!this.model || !this.apiKey) {
      throw new Error('VITE_GOOGLE_API_KEY is not configured.')
    }

    const messages = [
      new SystemMessage(this.systemPrompt),
      ...history.map((turn) => turn.role === 'user'
        ? new HumanMessage(turn.text)
        : new AIMessage(turn.text)),
      new HumanMessage(validQuestion),
    ]
    const result = await this.model.invoke(messages)
    return validateResponse(getResponseText(result.content))
  }
}
