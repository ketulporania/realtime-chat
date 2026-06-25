"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
  messages: ChatMessage[];
  currentUserId: string;
  typingUsers: string[];
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  roomName?: string;
}

export function ChatWindow({
  messages,
  currentUserId,
  typingUsers,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  roomName,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typingUsers]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) onTypingStop();
    };
  }, [onTypingStop]);

  function handleInputChange(value: string) {
    setInput(value);
    if (disabled) return;

    if (value.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart();
    }
    if (!value.trim() && isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTypingStop();
      }, 1500);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || disabled) return;
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onSendMessage(content);
    setInput("");
  }

  const othersTyping = typingUsers.filter((name) => name.length > 0);
  const placeholder = disabled
    ? "Reconnecting..."
    : roomName
      ? `Message #${roomName.toLowerCase().replace(/\s+/g, "-")}...`
      : "Type a message...";

  return (
    <div className="flex min-h-0 flex-1 basis-0 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 basis-0 overflow-y-auto chat-scroll px-2 py-3 sm:px-4 sm:py-4 lg:px-6 xl:px-8"
      >
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-1 items-center justify-center py-12">
            <EmptyState
              title="Start the conversation"
              description="Send the first message — everyone in this room will see it instantly."
              icon={
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl ring-1 ring-indigo-100">
                  💬
                </div>
              }
            />
          </div>
        ) : (
          <div className="w-full">
            <div className="mb-4 flex items-center gap-3 sm:mb-6">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">Today</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            {messages.map((message, index) => {
              const prev = messages[index - 1];
              const sameAuthor =
                prev?.userId === message.userId &&
                new Date(message.createdAt).getTime() -
                  new Date(prev.createdAt).getTime() <
                  120_000;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.userId === currentUserId}
                  showAvatar={!sameAuthor}
                />
              );
            })}
          </div>
        )}
      </div>

      {othersTyping.length > 0 && (
        <div className="shrink-0 border-t border-slate-100 bg-white/80 px-3 py-2 sm:px-5 lg:px-8">
          <p className="mx-auto max-w-none text-xs text-slate-500 sm:max-w-2xl lg:max-w-3xl">
            <span className="inline-flex items-center gap-2">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
              </span>
              {othersTyping.length === 1
                ? `${othersTyping[0]} is typing`
                : `${othersTyping.slice(0, 2).join(", ")} are typing`}
            </span>
          </p>
        </div>
      )}

      <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-5 sm:py-3 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-none lg:max-w-3xl xl:max-w-4xl"
        >
          <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 shadow-sm ring-1 ring-slate-100 focus-within:border-indigo-300 focus-within:ring-indigo-100 sm:gap-3 sm:rounded-2xl sm:p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:py-2.5 sm:text-[15px]"
            />
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-xl"
              aria-label="Send message"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
