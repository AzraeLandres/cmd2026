import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { SEND_CHAT_MESSAGE } from '../graphql/mutations';

interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

const INTRO: ChatMessage = {
  role:    'assistant',
  content: 'Bonjour ! Je suis l\'assistant IA de CDM 2026 Tracker 🏆 Pose-moi tes questions sur les matchs, les scores, les équipes ou le calendrier !',
};

export default function ChatBot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);
  const [input, setInput]       = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const fabRef    = useRef<HTMLButtonElement>(null);

  const [sendMessage, { loading }] = useMutation<{ sendChatMessage: string }>(SEND_CHAT_MESSAGE);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      fabRef.current?.focus();
    }
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const { data } = await sendMessage({ variables: { message: text } });
      const reply = data?.sendChatMessage ?? 'Désolé, aucune réponse reçue.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Désolé, une erreur est survenue. Vérifiez que GROQ_API_KEY est configuré.' },
      ]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === 'Escape') setOpen(false);
  }

  return (
    <>
      {open && (
        <div className="chat-window" role="dialog" aria-modal="true" aria-labelledby="chat-title">
          <div className="chat-header">
            <span className="chat-title" id="chat-title">🏆 Assistant CDM 2026</span>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Fermer le chat">✕</button>
          </div>

          <div
            className="chat-messages"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Conversation avec l'assistant"
          >
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg-${m.role}`}>{m.content}</div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg-assistant chat-typing" aria-label="L'assistant rédige une réponse">
                <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              disabled={loading}
              aria-label="Votre message"
            />
            <button
              className="chat-send"
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Envoyer le message"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        ref={fabRef}
        className={'chat-fab' + (open ? ' chat-fab-open' : '')}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Fermer le chat' : 'Ouvrir l\'assistant IA'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {open ? '✕' : '💬'}
      </button>
    </>
  );
}
