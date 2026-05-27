"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AlbumForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch(`/api/events/${eventId}/albums`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: formData.get("title") })
    });

    setSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Album could not be created.");
      return;
    }

    form.reset();
    router.refresh();
  }

  return (
    <form className="flex flex-wrap items-end gap-3 border-b border-border pb-5" onSubmit={onSubmit}>
      <label className="grid min-w-56 flex-1 gap-2 text-sm font-medium">
        New album
        <input
          className="rounded-md border border-input bg-card px-3 py-2"
          name="title"
          placeholder="Ceremony, reception, backstage..."
          required
        />
      </label>
      <button className="button-primary h-10 gap-2" disabled={isSubmitting} type="submit">
        <Plus className="h-4 w-4" />
        {isSubmitting ? "Adding..." : "Add album"}
      </button>
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
