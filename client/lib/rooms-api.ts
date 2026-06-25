import { apiFetch, ChatMessage, Room } from "@/lib/api";

export interface MessagesPage {
  messages: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

const LIST_TTL_MS = 30_000;

let listInflight: Promise<Room[]> | null = null;
let listCache: { rooms: Room[]; fetchedAt: number } | null = null;

const roomInflight = new Map<string, Promise<Room>>();
const roomCache = new Map<string, { room: Room; fetchedAt: number }>();

const messagesInflight = new Map<string, Promise<MessagesPage>>();
const messagesCache = new Map<string, { data: MessagesPage; fetchedAt: number }>();

export function invalidateRoomsCache(): void {
  listCache = null;
  listInflight = null;
  roomCache.clear();
  roomInflight.clear();
  messagesCache.clear();
  messagesInflight.clear();
}

export function seedRoomInCache(room: Room): void {
  roomCache.set(room.id, { room, fetchedAt: Date.now() });

  if (listCache) {
    listCache = {
      rooms: [room, ...listCache.rooms.filter((r) => r.id !== room.id)],
      fetchedAt: Date.now(),
    };
  }
}

function getRoomFromListCache(roomId: string): Room | null {
  if (!listCache) return null;
  if (Date.now() - listCache.fetchedAt > LIST_TTL_MS) return null;
  return listCache.rooms.find((r) => r.id === roomId) ?? null;
}

/** Deduped fetch of all rooms — concurrent calls share one request. */
export async function fetchRoomsList(options?: {
  force?: boolean;
}): Promise<Room[]> {
  const force = options?.force ?? false;

  if (!force && listCache && Date.now() - listCache.fetchedAt < LIST_TTL_MS) {
    return listCache.rooms;
  }

  if (!force && listInflight) {
    return listInflight;
  }

  listInflight = apiFetch<{ rooms: Room[] }>("/api/rooms")
    .then((data) => {
      listCache = { rooms: data.rooms, fetchedAt: Date.now() };
      for (const room of data.rooms) {
        roomCache.set(room.id, { room, fetchedAt: Date.now() });
      }
      listInflight = null;
      return data.rooms;
    })
    .catch((err) => {
      listInflight = null;
      throw err;
    });

  return listInflight;
}

/** Fetch a single room — uses list cache when available, otherwise GET /api/rooms/:id */
export async function fetchRoom(
  roomId: string,
  options?: { force?: boolean }
): Promise<Room> {
  const force = options?.force ?? false;

  if (!force) {
    const fromList = getRoomFromListCache(roomId);
    if (fromList) return fromList;

    const cached = roomCache.get(roomId);
    if (cached && Date.now() - cached.fetchedAt < LIST_TTL_MS) {
      return cached.room;
    }

    const inflight = roomInflight.get(roomId);
    if (inflight) return inflight;
  }

  const request = apiFetch<{ room: Room }>(`/api/rooms/${roomId}`)
    .then((data) => {
      roomCache.set(roomId, { room: data.room, fetchedAt: Date.now() });
      roomInflight.delete(roomId);
      return data.room;
    })
    .catch((err) => {
      roomInflight.delete(roomId);
      throw err;
    });

  roomInflight.set(roomId, request);
  return request;
}

/** Deduped fetch of message history for a room. */
export async function fetchRoomMessages(
  roomId: string,
  options?: { force?: boolean }
): Promise<MessagesPage> {
  const force = options?.force ?? false;

  if (!force) {
    const cached = messagesCache.get(roomId);
    if (cached && Date.now() - cached.fetchedAt < LIST_TTL_MS) {
      return cached.data;
    }

    const inflight = messagesInflight.get(roomId);
    if (inflight) return inflight;
  }

  const request = apiFetch<MessagesPage>(`/api/rooms/${roomId}/messages`)
    .then((data) => {
      messagesCache.set(roomId, { data, fetchedAt: Date.now() });
      messagesInflight.delete(roomId);
      return data;
    })
    .catch((err) => {
      messagesInflight.delete(roomId);
      throw err;
    });

  messagesInflight.set(roomId, request);
  return request;
}
