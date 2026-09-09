import { useRef, useState, type FormEvent } from 'react'
import { ChatPanel } from './components/ChatPanel'
import { Disclaimer } from './components/Disclaimer'
import type { ChatService, ChatStatus, ConversationTurn } from './types/chat'

interface AppProps {
  chatService?: ChatService
}

function createTurn(role: ConversationTurn['role'], text: string): ConversationTurn {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    text,
    createdAt: Date.now(),
  }
}

export default function App({ chatService }: AppProps) {
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const requestVersion = useRef(0)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) {
      setValidationMessage('Please enter a question before submitting.')
      return
    }
    if (status === 'submitting') return

    setValidationMessage(null)
    setErrorMessage(null)
    setStatus('submitting')
    const history = turns
    const userTurn = createTurn('user', trimmedQuestion)
    setTurns((currentTurns) => [...currentTurns, userTurn])
    setQuestion('')
    const currentRequest = ++requestVersion.current

    try {
      if (!chatService) throw new Error('The chat service is not configured.')
      const response = await chatService.ask(trimmedQuestion, history)
      if (currentRequest !== requestVersion.current) return
      setTurns((currentTurns) => [...currentTurns, createTurn('assistant', response)])
      setStatus('idle')
    } catch {
      if (currentRequest !== requestVersion.current) return
      setStatus('error')
      setErrorMessage('We could not get an answer right now. Please try again.')
    }
  }

  const handleNewChat = () => {
    requestVersion.current += 1
    setTurns([])
    setQuestion('')
    setStatus('idle')
    setErrorMessage(null)
    setValidationMessage(null)
  }

  return (
    <main className="app-shell">
      <div className="app-shell__glow" aria-hidden="true" />
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">CA</div>
        <div>
          <p className="kicker">A clearer next step</p>
          <h1>CA Buddy</h1>
        </div>
        <span className="header-status"><span /> India tax basics</span>
      </header>

      <ChatPanel
        question={question}
        turns={turns}
        status={status}
        errorMessage={errorMessage}
        validationMessage={validationMessage}
        onQuestionChange={(value) => {
          setQuestion(value)
          if (validationMessage) setValidationMessage(null)
        }}
        onSubmit={handleSubmit}
        onNewChat={handleNewChat}
      />
      <Disclaimer />
    </main>
  )
}
