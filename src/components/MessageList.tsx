import type { ConversationTurn } from '../types/chat'

interface MessageListProps {
  turns: ConversationTurn[]
}

export function MessageList({ turns }: MessageListProps) {
  if (turns.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__eyebrow">Everyday clarity</span>
        <p>Ask about GST, TDS, ITR deadlines, or audit basics.</p>
      </div>
    )
  }

  return (
    <ol className="message-list" aria-live="polite">
      {turns.map((turn) => (
        <li className={`message message--${turn.role}`} key={turn.id}>
          <span className="message__role">{turn.role === 'user' ? 'You' : 'CA Buddy'}</span>
          <p>{turn.text}</p>
        </li>
      ))}
    </ol>
  )
}
