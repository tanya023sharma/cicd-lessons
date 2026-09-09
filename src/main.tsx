import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GeminiChatService } from './services/geminiModel'
import './styles.css'

const chatService = new GeminiChatService()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App chatService={chatService} />
  </StrictMode>,
)
