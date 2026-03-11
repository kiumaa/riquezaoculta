"use client";

import { useEffect, useRef, useState } from "react";
import { useFunnelStore } from "@/lib/store/funnel-store";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_REPLIES = [
  "É seguro pagar aqui?",
  "O que recebo exactamente?",
  "Como pago no ATM?",
  "4500 Kz é muito caro?",
];

export function ChatWidget() {
  const name = useFunnelStore(state => state.name);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstName = name ? name.split(" ")[0] : null;
  const greeting = firstName
    ? `Olá ${firstName}! Posso ajudar-te com alguma dúvida? 😊`
    : "Olá! Posso ajudar-te com alguma dúvida? 😊";

  // Auto-open after 25s of inactivity (once only)
  useEffect(() => {
    if (hasAutoOpened) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasAutoOpened(true);
    }, 25000);
    return () => clearTimeout(timer);
  }, [hasAutoOpened]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, name })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? "Desculpa, tenta de novo." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erro de ligação. Tenta de novo." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat bubble */}
      {isOpen ? (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col w-[320px] sm:w-[360px] rounded-2xl border border-white/[0.10] bg-[#0c0c0c]/95 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-brand/[0.10] border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/20">
                <span className="text-sm font-bold text-brand">S</span>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-[#0c0c0c]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-none">Sofia</p>
                <p className="text-[10px] text-brand/80 mt-0.5">Assistente Riqueza Oculta</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fechar chat"
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-muted hover:bg-white/10 hover:text-white transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-3 overflow-y-auto p-4 min-h-[200px] max-h-[340px]">
            {/* Welcome */}
            <div className="flex gap-2 items-end">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20">
                <span className="text-[10px] font-bold text-brand">S</span>
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-white/[0.07] px-3 py-2 max-w-[80%]">
                <p className="text-[12px] text-soft leading-relaxed">{greeting}</p>
              </div>
            </div>

            {/* Quick replies (only before first user message) */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 pl-8">
                {QUICK_REPLIES.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-[11px] text-soft hover:border-brand/40 hover:text-brand transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 items-end ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20">
                    <span className="text-[10px] font-bold text-brand">S</span>
                  </div>
                )}
                <div className={`rounded-2xl px-3 py-2 max-w-[80%] ${msg.role === "user" ? "rounded-br-sm bg-brand/[0.15] text-right" : "rounded-bl-sm bg-white/[0.07]"}`}>
                  <p className="text-[12px] text-soft leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2 items-end">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20">
                  <span className="text-[10px] font-bold text-brand">S</span>
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-white/[0.07] px-3 py-2">
                  <div className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.07] px-3 py-3 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Escreve aqui..."
              className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-[12px] text-ink placeholder:text-muted/40 focus:border-brand/40 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-black disabled:opacity-40 transition hover:bg-brandBright"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Abrir chat de apoio"
          onClick={() => { setIsOpen(true); setHasAutoOpened(true); }}
          className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand shadow-[0_4px_24px_rgba(32,230,126,0.35)] transition hover:scale-110 hover:shadow-[0_4px_32px_rgba(32,230,126,0.5)] animate-[pulse_3s_ease-in-out_infinite]"
        >
          <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </>
  );
}
