"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, MobileTopBar } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { RoomList } from "@/components/RoomList";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { useAuth } from "@/context/AuthContext";
import { ApiError, Room, apiFetch } from "@/lib/api";
import { fetchRoomsList, seedRoomInCache } from "@/lib/rooms-api";

export default function RoomsPage() {
  return (
    <AuthGuard>
      <RoomsPageContent />
    </AuthGuard>
  );
}

function RoomsPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  const fetchRooms = useCallback(async (force = false) => {
    setLoading(true);
    setError("");
    try {
      const rooms = await fetchRoomsList({ force });
      setRooms(rooms);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load rooms. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  async function handleSelectRoom(room: Room) {
    setJoiningRoomId(room.id);
    setError("");
    seedRoomInCache(room);

    try {
      if (!room.isMember) {
        await apiFetch(`/api/rooms/${room.id}/join`, { method: "POST" });
      }
      router.push(`/rooms/${room.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to join room. Please try again."
      );
      setJoiningRoomId(null);
    }
  }

  function handleRoomCreated(room: Room) {
    seedRoomInCache(room);
    setRooms((prev) => [room, ...prev.filter((r) => r.id !== room.id)]);
    router.push(`/rooms/${room.id}`);
  }

  if (!user) return null;

  const joinedCount = rooms.filter((r) => r.isMember).length;

  return (
    <AppShell user={user} onLogout={logout}>
      <MobileTopBar
        title="Rooms"
        subtitle={`${rooms.length} rooms`}
        user={user}
        onLogout={logout}
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs"
          >
            + New
          </button>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 chat-scroll sm:px-4 sm:py-6 lg:px-8">
        {!loading && rooms.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:flex sm:flex-wrap">
            <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 card-shadow">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total rooms
              </p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">
                {rooms.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 card-shadow">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Joined
              </p>
              <p className="mt-0.5 text-2xl font-bold text-indigo-600">
                {joinedCount}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4">
            <AlertBanner
              message={error}
              onDismiss={() => setError("")}
              onRetry={() => fetchRooms(true)}
            />
          </div>
        )}

        <RoomList
          rooms={rooms}
          loading={loading}
          joiningRoomId={joiningRoomId}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={() => setModalOpen(true)}
        />
      </main>

      <CreateRoomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleRoomCreated}
      />
    </AppShell>
  );
}
