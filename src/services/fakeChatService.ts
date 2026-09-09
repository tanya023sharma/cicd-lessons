import type { ChatService, ConversationTurn } from '../types/chat'
import { validateQuestion, validateResponse } from './chatService'

type FakeResponse = string | ((question: string, history: ConversationTurn[]) => string | Promise<string>)

export class FakeChatService implements ChatService {
  readonly calls: Array<{ question: string; history: ConversationTurn[] }> = []

  constructor(
    private readonly response: FakeResponse = 'I can help with general GST, TDS, ITR deadlines, and audit basics.',
    private readonly failure?: Error,
  ) {}

  async ask(question: string, history: ConversationTurn[]): Promise<string> {
    const validQuestion = validateQuestion(question)
    this.calls.push({ question: validQuestion, history: history.map((turn) => ({ ...turn })) })
    if (this.failure) throw this.failure
    const response = typeof this.response === 'function'
      ? await this.response(validQuestion, history)
      : this.response
    return validateResponse(response)
  }
}
