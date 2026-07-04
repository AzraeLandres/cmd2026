import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { SEND_CHAT_MESSAGE } from "@graphql/mutations";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const INTRO: ChatMessage = {
  role: "assistant",
  content:
    "Bonjour ! Je suis l'assistant IA de CDM 2026 Tracker 🏆 Pose-moi tes questions sur les matchs, les scores, les équipes ou le calendrier !",
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const [sendMessage, { loading }] = useMutation<{ sendChatMessage: string }>(
    SEND_CHAT_MESSAGE,
  );

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const { data } = await sendMessage({ variables: { message: text } });
      const reply = data?.sendChatMessage ?? "Désolé, aucune réponse reçue.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Désolé, une erreur est survenue. Vérifiez que GROQ_API_KEY est configuré.",
        },
      ]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-36 right-4 z-50 flex max-h-[70vh] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-app"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-title"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span
              className="text-sm font-semibold text-text"
              id="chat-title"
            >
              🏆 Assistant CDM 2026
            </span>
            <button
              className="text-lg leading-none text-textMuted hover:text-text"
              onClick={() => setOpen(false)}
              aria-label="Fermer le chat"
            >
              ✕
            </button>
          </div>

          <div
            className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Conversation avec l'assistant"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                  (m.role === "user"
                    ? "self-end bg-primary text-white"
                    : "self-start bg-bg text-text")
                }
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div
                className="flex items-center gap-1 self-start rounded-2xl bg-bg px-3 py-2"
                aria-label="L'assistant rédige une réponse"
              >
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-textMuted"
                    style={{ animationDelay: `${delay}ms` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              ref={inputRef}
              className="flex-1 rounded-full border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              disabled={loading}
              aria-label="Votre message"
            />
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
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
        className={
          "fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-app transition-transform hover:scale-105 " +
          (open ? "scale-95" : "")
        }
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Fermer le chat" : "Ouvrir l'assistant IA"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
