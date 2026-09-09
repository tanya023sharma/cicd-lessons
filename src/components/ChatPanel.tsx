import type { FormEvent } from 'react'
import type { ChatStatus, ConversationTurn } from '../types/chat'
import { MessageList } from './MessageList'

interface ChatPanelProps {
  question: string
  turns: ConversationTurn[]
  status: ChatStatus
  errorMessage: string | null
  validationMessage: string | null
  onQuestionChange: (question: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onNewChat: () => void
}

export function ChatPanel({
  question,
  turns,
  status,
  errorMessage,
  validationMessage,
  onQuestionChange,
  onSubmit,
  onNewChat,
}: ChatPanelProps) {
  const isSubmitting = status === 'submitting'

  return (
    <section className="chat-panel" aria-label="CA Buddy chat">
      <div className="chat-panel__topline">
        <div>
          <span className="section-label">Your working desk</span>
          <h2>What would you like to understand?</h2>
        </div>
        <button className="button button--quiet" type="button" onClick={onNewChat}>
          New chat
        </button>
      </div>

      <MessageList turns={turns} />

      {isSubmitting && (
        <div className="status-message" role="status">
          CA Buddy is checking the details...
        </div>
      )}
      {errorMessage && <div className="status-message status-message--error" role="alert">{errorMessage}</div>}

      <form className="question-form" onSubmit={onSubmit}>
        <label htmlFor="question">Your question</label>
        <div className="question-form__row">
          <input
            id="question"
            name="question"
            type="text"
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            placeholder="e.g. When is my next GST return due?"
            autoComplete="off"
            disabled={isSubmitting}
            aria-describedby={validationMessage ? 'question-error' : undefined}
          />
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Ask CA Buddy'}
          </button>
        </div>
        {validationMessage && <p className="field-error" id="question-error" role="alert">{validationMessage}</p>}
      </form>
    </section>
  )
}
