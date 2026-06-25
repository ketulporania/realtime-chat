"use client";

import { UserProfile } from "@/lib/api";

interface OnlineUsersListProps {
  onlineUserIds: string[];
  userProfiles: Map<string, UserProfile>;
  currentUserId: string;
  variant?: "bar" | "sidebar";
}

export function OnlineUsersList({
  onlineUserIds,
  userProfiles,
  currentUserId,
  variant = "bar",
}: OnlineUsersListProps) {
  if (variant === "sidebar") {
    return (
      <div>
        <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Online — {onlineUserIds.length}
        </p>
        {onlineUserIds.length === 0 ? (
          <p className="px-1 text-sm text-slate-500">No one online</p>
        ) : (
          <ul className="space-y-1">
            {onlineUserIds.map((userId) => {
              const profile = userProfiles.get(userId);
              const isYou = userId === currentUserId;
              const username =
                profile?.username ??
                (isYou ? "You" : `User ${userId.slice(0, 4)}`);
              const avatarColor = profile?.avatarColor ?? "#6366f1";

              return (
                <li
                  key={userId}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-slate-300"
                >
                  <span className="relative">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {username.charAt(0).toUpperCase()}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
                  </span>
                  <span className="truncate text-sm">
                    {isYou ? "You" : username}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-slate-200/80 bg-white/60 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 overflow-x-auto chat-scroll pb-0.5">
        <span className="mr-1 shrink-0 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Online
        </span>
        {onlineUserIds.length === 0 ? (
          <span className="text-sm text-slate-400">No one here yet</span>
        ) : (
          onlineUserIds.map((userId) => {
            const profile = userProfiles.get(userId);
            const isYou = userId === currentUserId;
            const username =
              profile?.username ??
              (isYou ? "You" : `User ${userId.slice(0, 4)}`);
            const avatarColor = profile?.avatarColor ?? "#6366f1";

            return (
              <span
                key={userId}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-3 shadow-sm ring-1 ring-slate-200/80"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {username.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {isYou ? "You" : username}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
