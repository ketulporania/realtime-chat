"use client";

import { FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { AuthError } from "@/components/AuthLayout";
import { ApiError, Room, apiFetch } from "@/lib/api";
import { invalidateRoomsCache, seedRoomInCache } from "@/lib/rooms-api";

const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, "Room name is required")
    .max(64, "Room name must be at most 64 characters")
    .trim(),
  isPrivate: z.boolean(),
});

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20";

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (room: Room) => void;
}

export function CreateRoomModal({
  open,
  onClose,
  onCreated,
}: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setIsPrivate(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = createRoomSchema.safeParse({ name, isPrivate });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch<{ room: Room }>("/api/rooms", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      invalidateRoomsCache();
      seedRoomInCache(data.room);
      onCreated(data.room);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to create room. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="animate-slide-up relative flex max-h-[min(90dvh,640px)] w-full max-w-md flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Create a room</h2>
        <p className="mt-1 text-sm text-slate-500">
          Start a new chat space for your team or community.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <AuthError message={error} />}

          <div>
            <label
              htmlFor="room-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Room name
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              placeholder="General"
              autoFocus
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:bg-slate-50">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Private room
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Only visible to members you invite
              </span>
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
