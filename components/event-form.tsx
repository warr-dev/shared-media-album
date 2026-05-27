"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { EventType } from "@/lib/db/schema-types";

const eventTypes: EventType[] = [
  "wedding",
  "birthday",
  "conference",
  "concert",
  "reunion",
  "party",
  "custom"
];

export function EventForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        eventType: formData.get("eventType"),
        startsAt: new Date(String(formData.get("startsAt"))).toISOString(),
        endsAt: formData.get("endsAt")
          ? new Date(String(formData.get("endsAt"))).toISOString()
          : undefined,
        albumTitle: formData.get("albumTitle"),
        description: formData.get("description") || undefined,
        location: formData.get("location") || undefined
      })
    });

    setSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (response.status === 401) {
        router.push("/login?next=/events/new");
        return;
      }
      setError(body?.error ?? "Event could not be created.");
      return;
    }

    const created = (await response.json()) as { eventId: string };
    router.push(`/events/${created.eventId}`);
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        Event name
        <input className="rounded-md border border-input bg-card px-3 py-2" name="name" required />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Event type
        <select className="rounded-md border border-input bg-card px-3 py-2" name="eventType" required>
          {eventTypes.map((eventType) => (
            <option key={eventType} value={eventType}>
              {eventType}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Starts at
          <input
            className="rounded-md border border-input bg-card px-3 py-2"
            name="startsAt"
            required
            type="datetime-local"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Ends at
          <input className="rounded-md border border-input bg-card px-3 py-2" name="endsAt" type="datetime-local" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Album title
        <input className="rounded-md border border-input bg-card px-3 py-2" name="albumTitle" required />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Location
        <input className="rounded-md border border-input bg-card px-3 py-2" name="location" />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea className="min-h-28 rounded-md border border-input bg-card px-3 py-2" name="description" />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button className="button-primary w-fit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating..." : "Create event"}
      </button>
    </form>
  );
}
