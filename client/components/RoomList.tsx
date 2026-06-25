"use client";

import { Room } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

interface RoomListProps {
  rooms: Room[];
  loading: boolean;
  joiningRoomId: string | null;
  onSelectRoom: (room: Room) => void;
  onCreateRoom?: () => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RoomListSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {[1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 card-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-200" />
            <div className="flex-1">
              <div className="h-5 w-2/3 rounded-lg bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded-lg bg-slate-100" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MembersIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export function RoomList({
  rooms,
  loading,
  joiningRoomId,
  onSelectRoom,
  onCreateRoom,
}: RoomListProps) {
  if (loading) {
    return (
      <div className="py-2">
        <RoomListSkeleton />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="No rooms yet"
        description="Create your first room and invite others to start chatting in real time."
        action={
          onCreateRoom
            ? { label: "Create a room", onClick: onCreateRoom }
            : undefined
        }
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {rooms.map((room) => {
        const isJoining = joiningRoomId === room.id;

        return (
          <li key={room.id}>
            <button
              type="button"
              onClick={() => onSelectRoom(room)}
              disabled={!!joiningRoomId}
              className="group flex h-full w-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 text-left card-shadow transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-lg font-bold text-white shadow-md shadow-indigo-500/25">
                  {room.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-slate-900">
                      {room.name}
                    </span>
                    {room.isPrivate && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Private
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                    <MembersIcon />
                    <span>
                      {room.memberCount}{" "}
                      {room.memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">
                  Created {formatDate(room.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  {room.isMember && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      Joined
                    </span>
                  )}
                  {isJoining ? (
                    <Spinner size="sm" />
                  ) : (
                    <span className="text-sm font-semibold text-indigo-600 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                      Enter →
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
