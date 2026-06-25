"use client";

import { ChatMessage } from "@/lib/api";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
}: MessageBubbleProps) {
  const avatarColor = message.avatarColor ?? "#6366f1";

  return (
    <div
      className={`group flex gap-2 sm:gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"} ${showAvatar ? "mt-3" : "mt-0.5"}`}
    >
      {!isOwn && showAvatar ? (
        <span
          className="mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md sm:h-9 sm:w-9"
          style={{ backgroundColor: avatarColor }}
        >
          {message.username.charAt(0).toUpperCase()}
        </span>
      ) : !isOwn ? (
        <span className="w-8 shrink-0 sm:w-9" />
      ) : null}

      <div
        className={`flex w-full max-w-[95%] flex-col sm:max-w-[min(90%,40rem)] lg:max-w-[min(80%,42rem)] ${isOwn ? "items-end" : "items-start"}`}
      >
        {!isOwn && showAvatar && (
          <span className="mb-1.5 px-1 text-xs font-semibold text-slate-600">
            {message.username}
          </span>
        )}
        <div
          className={`relative px-3 py-2 sm:px-4 sm:py-2.5 ${
            isOwn
              ? "rounded-2xl rounded-br-md bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "rounded-2xl rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200/80 shadow-sm"
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-[15px]">
            {message.content}
          </p>
        </div>
        {showAvatar && (
          <span className="mt-1 px-1 text-[11px] text-slate-400 opacity-0 transition group-hover:opacity-100">
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}
