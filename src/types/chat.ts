export type ChatRole = 'user' | 'assistant'

export interface ConversationTurn {
  id: string
  role: ChatRole
  text: string
  createdAt: number
}

export interface ChatService {
  ask(question: string, history: ConversationTurn[]): Promise<string>
}

export type ChatStatus = 'idle' | 'submitting' | 'error'
