"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useFunnelStore } from "@/lib/store/funnel-store";
import sofiaAvatar from "@/public/ChatGPT Image 11_03_2026, 17_06_24.png";

type Message = { role: "user" | "assistant"; content: string };

const DEFAULT_QUICK_REPLIES = [
  "É seguro pagar aqui?",
  "O que recebo exactamente?",
  "Como pago no ATM?",
  "2499 Kz é muito caro?",
];

export function ChatWidget({
  quickReplies = DEFAULT_QUICK_REPLIES,
}: {
  quickReplies?: string[];
} = {}) {
  const name = useFunnelStore(state => state.name);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstName = name ? name.split(" ")[0] : null;
  const greeting = firstName
    ? `Olá ${firstName}! Sou a Sofia, assistente da Riqueza Oculta. Posso ajudar-te com alguma dúvida?`
    : "Olá! Sou a Sofia, assistente da Riqueza Oculta. Posso ajudar-te com alguma dúvida?";

  // Auto-open desactivado — o utilizador abre manualmente

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Lock body scroll & prevent zoom when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
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
      {/* Floating bubble */}
      {!isOpen && (
        <button
          type="button"
          aria-label="Falar com a Sofia"
          onClick={() => setIsOpen(true)}
          className="fixed z-50 flex items-center gap-2 group"
          style={{ bottom: "max(20px, env(safe-area-inset-bottom, 20px))", right: "16px" }}
        >
          {/* Label */}
          <span className="whitespace-nowrap rounded-full bg-[#0c130e]/90 border border-white/[0.10] px-2.5 py-1 text-[11px] font-medium text-soft shadow-md backdrop-blur-sm">
            Precisa de ajuda?
          </span>
          {/* Avatar + dot */}
          <div className="relative shrink-0">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-brand shadow-[0_3px_14px_rgba(32,230,126,0.30)] transition-transform duration-200 group-hover:scale-110">
              <Image src={sofiaAvatar} alt="Sofia" fill className="object-cover" />
            </div>
            {/* Online dot */}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-[#080d0a]" />
          </div>
        </button>
      )}

      {/* Full-screen chat — app-like layout */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#080d0a] animate-in fade-in duration-200"
          style={{
            /* Respeita safe areas de dispositivos com notch/barra nav */
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            /* Garante que ocupa exactamente o viewport visível */
            height: "100dvh",
            maxHeight: "100dvh",
            touchAction: "none",
          }}
        >

          {/* ── Header ── */}
          <div
            className="flex items-center gap-3 border-b border-white/[0.08] bg-[#0c130e] px-4 shrink-0"
            style={{ minHeight: "56px", paddingTop: "4px", paddingBottom: "4px" }}
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-brand/30">
              <Image src={sofiaAvatar} alt="Sofia" fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Sofia</p>
              <p className="text-[11px] text-brand/80">Assistente Riqueza Oculta • Online</p>
            </div>
            <button
              type="button"
              aria-label="Fechar chat"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-muted hover:bg-white/10 hover:text-white transition shrink-0"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Messages area — único elemento scrollável ── */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-4"
            style={{
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
              minHeight: 0, /* Flexbox fix para scroll correcto */
            }}
          >

            {/* Welcome message */}
            <div className="flex gap-3 items-end">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-brand/20">
                <Image src={sofiaAvatar} alt="Sofia" fill className="object-cover" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white/[0.07] px-4 py-3">
                <p className="text-[13px] text-soft leading-relaxed">{greeting}</p>
              </div>
            </div>

            {/* Quick replies — only before first message */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pl-11">
                {quickReplies.map((q: string) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-white/[0.12] bg-white/[0.05] px-3 py-1.5 text-[12px] text-soft hover:border-brand/50 hover:text-brand transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 items-end ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-brand/20">
                    <Image src={sofiaAvatar} alt="Sofia" fill className="object-cover" />
                  </div>
                )}
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/20 border border-brand/30">
                    <span className="text-[11px] font-bold text-brand">{firstName?.[0]?.toUpperCase() ?? "U"}</span>
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "rounded-br-sm bg-brand/[0.15]" : "rounded-bl-sm bg-white/[0.07]"}`}>
                  <p className="text-[13px] text-soft leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex gap-3 items-end">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-brand/20">
                  <Image src={sofiaAvatar} alt="Sofia" fill className="object-cover" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-white/[0.07] px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <span className="h-2 w-2 rounded-full bg-brand/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-brand/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-brand/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>



          {/* ── Input bar — fixo no fundo com safe area ── */}
          <div
            className="shrink-0 border-t border-white/[0.08] bg-[#0c130e] px-4 flex gap-2 items-center"
            style={{
              paddingTop: "10px",
              paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Escreve a tua dúvida..."
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="off"
              className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-[16px] text-ink placeholder:text-muted/40 focus:border-brand/40 focus:outline-none transition"
              style={{ fontSize: "16px" /* 16px previne zoom no iOS */ }}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Enviar mensagem"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-black disabled:opacity-40 transition hover:bg-brandBright active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
