import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App'
import type { ChatService } from '../../src/types/chat'

function createService(answer = 'GST returns are filed according to the taxpayer\'s applicable registration and filing frequency.') {
  return {
    ask: vi.fn<ChatService['ask']>().mockResolvedValue(answer),
  }
}

describe('CA Buddy shell', () => {
  it('renders the required first-screen controls and disclaimer', () => {
    render(<App chatService={createService()} />)

    expect(screen.getByRole('heading', { name: 'CA Buddy' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Your question' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask CA Buddy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New chat' })).toBeInTheDocument()
    expect(screen.getByText('General information only. CA Buddy is not a substitute for advice from a Chartered Accountant.')).toBeInTheDocument()
  })

  it('rejects an empty question without creating a turn', async () => {
    const user = userEvent.setup()
    const service = createService()
    render(<App chatService={service} />)

    await user.click(screen.getByRole('button', { name: 'Ask CA Buddy' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a question')
    expect(service.ask).not.toHaveBeenCalled()
  })

  it('shows the submitted question and returned answer', async () => {
    const user = userEvent.setup()
    const service = createService()
    render(<App chatService={service} />)

    await user.type(screen.getByRole('textbox', { name: 'Your question' }), 'How does GST registration work?')
    await user.click(screen.getByRole('button', { name: 'Ask CA Buddy' }))

    expect(screen.getByText('How does GST registration work?')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/GST returns are filed/)).toBeInTheDocument())
    expect(service.ask).toHaveBeenCalledWith('How does GST registration work?', [])
  })
})
