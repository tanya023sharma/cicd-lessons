import type { ChatService, ConversationTurn } from '../types/chat'

export const GEMINI_MODEL = 'gemini-3.6-flash'
export const GEMINI_MAX_OUTPUT_TOKENS = 512

export function validateQuestion(question: string): string {
  const trimmedQuestion = question.trim()
  if (!trimmedQuestion) throw new Error('Question must not be empty.')
  return trimmedQuestion
}

export function validateResponse(response: string): string {
  const trimmedResponse = response.trim()
  if (!trimmedResponse) throw new Error('The model returned an empty response.')
  return trimmedResponse
}

export type { ChatService }
export type { ConversationTurn }
