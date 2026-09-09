import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App'
import { CA_BUDDY_SYSTEM_PROMPT } from '../../src/services/caBuddyPrompt'
import type { ChatService } from '../../src/types/chat'

function createService() {
  return { ask: vi.fn<ChatService['ask']>() }
}

describe('conversation memory and reset', () => {
  it('defines a scoped CA prompt with uncertainty and professional-boundary guidance', () => {
    expect(CA_BUDDY_SYSTEM_PROMPT).toContain('Indian GST, TDS, ITR deadlines, and audit basics')
    expect(CA_BUDDY_SYSTEM_PROMPT).toContain('latest official notification or portal')
    expect(CA_BUDDY_SYSTEM_PROMPT).toContain('qualified Chartered Accountant')
  })

  it('forwards ordered active turns to a follow-up request', async () => {
    const user = userEvent.setup()
    const service = createService()
    service.ask
      .mockResolvedValueOnce('GST answer')
      .mockResolvedValueOnce('TDS answer using the earlier context')
    render(<App chatService={service} />)

    const input = screen.getByRole('textbox', { name: 'Your question' })
    await user.type(input, 'What is GST?')
    await user.click(screen.getByRole('button', { name: 'Ask CA Buddy' }))
    await screen.findByText('GST answer')

    await user.type(input, 'And what is TDS?')
    await user.click(screen.getByRole('button', { name: 'Ask CA Buddy' }))
    await screen.findByText('TDS answer using the earlier context')

    expect(service.ask).toHaveBeenNthCalledWith(2, 'And what is TDS?', [
      expect.objectContaining({ role: 'user', text: 'What is GST?' }),
      expect.objectContaining({ role: 'assistant', text: 'GST answer' }),
    ])
  })

  it('clears visible and supplied history when starting a new chat', async () => {
    const user = userEvent.setup()
    const service = createService()
    service.ask.mockResolvedValue('Fresh answer')
    render(<App chatService={service} />)

    const input = screen.getByRole('textbox', { name: 'Your question' })
    await user.type(input, 'What is GST?')
    await user.click(screen.getByRole('button', { name: 'Ask CA Buddy' }))
    await screen.findByText('Fresh answer')
    await user.click(screen.getByRole('button', { name: 'New chat' }))

    expect(screen.queryByText('What is GST?')).not.toBeInTheDocument()
    expect(screen.queryByText('Fresh answer')).not.toBeInTheDocument()

    await user.type(input, 'What is TDS?')
    await user.click(screen.getByRole('button', { name: 'Ask CA Buddy' }))
    await waitFor(() => expect(service.ask).toHaveBeenNthCalledWith(2, 'What is TDS?', []))
  })

  it('does not restore a stale response after reset during submission', async () => {
    const user = userEvent.setup()
    const service = createService()
    let resolvePending!: (answer: string) => void
    service.ask.mockReturnValueOnce(new Promise((resolve) => { resolvePending = resolve }))
    render(<App chatService={service} />)

    const input = screen.getByRole('textbox', { name: 'Your question' })
    await user.type(input, 'Old question')
    await user.click(screen.getByRole('button', { name: 'Ask CA Buddy' }))
    await user.click(screen.getByRole('button', { name: 'New chat' }))
    resolvePending('Stale answer')

    await waitFor(() => expect(screen.queryByText('Stale answer')).not.toBeInTheDocument())
    expect(screen.queryByText('Old question')).not.toBeInTheDocument()
  })
})
