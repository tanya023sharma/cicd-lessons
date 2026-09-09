import { describe, expect, it } from 'vitest'
import { FakeChatService } from '../../src/services/fakeChatService'
import {
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MODEL,
  validateQuestion,
  validateResponse,
} from '../../src/services/chatService'
import { createGeminiModelOptions } from '../../src/services/geminiModel'

describe('ChatService boundary', () => {
  it('uses the required Gemini model configuration', () => {
    expect(createGeminiModelOptions('test-key')).toEqual({
      model: GEMINI_MODEL,
      apiKey: 'test-key',
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      temperature: 0.2,
      maxRetries: 0,
      streaming: false,
    })
    expect(GEMINI_MODEL).toBe('gemini-3.6-flash')
    expect(GEMINI_MAX_OUTPUT_TOKENS).toBe(512)
  })

  it('records ordered history and returns deterministic fake text', async () => {
    const service = new FakeChatService((question, history) => `${question} follows ${history.length} turns.`)
    const history = [{ id: 'one', role: 'user' as const, text: 'What is GST?', createdAt: 1 }]

    await expect(service.ask(' And TDS?', history)).resolves.toBe('And TDS? follows 1 turns.')
    expect(service.calls).toEqual([{ question: 'And TDS?', history }])
  })

  it('supports controlled failures without fabricating a response', async () => {
    const service = new FakeChatService('unused', new Error('network unavailable'))
    await expect(service.ask('What is an ITR deadline?', [])).rejects.toThrow('network unavailable')
  })

  it('rejects empty questions and responses', () => {
    expect(() => validateQuestion('  ')).toThrow('Question must not be empty')
    expect(() => validateResponse('  ')).toThrow('empty response')
  })
})
