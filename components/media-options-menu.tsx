"use client";

import { Copy, Download, EllipsisVertical, ImagePlus, MoveRight, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { MediaAlbumOption } from "@/components/media-grid";

export function MediaOptionsMenu({
  mediaId,
  albumId,
  albumOptions = [],
  previewUrl,
  canTag,
  canRemove,
  canSetCover
}: {
  mediaId: string;
  albumId: string;
  albumOptions?: MediaAlbumOption[];
  previewUrl?: string | null;
  canTag?: boolean;
  canRemove?: boolean;
  canSetCover?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  async function addTag() {
    const displayName = window.prompt("Tag name");

    if (!displayName?.trim()) {
      return;
    }

    setStatus("Saving...");
    const response = await fetch(`/api/media/${mediaId}/tags`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tagType: "text", displayName })
    });

    setStatus(response.ok ? "Tagged" : "Tag failed");
    setOpen(false);
  }

  async function setAlbumCover() {
    setStatus("Saving...");
    const response = await fetch(`/api/albums/${albumId}/cover`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mediaId })
    });

    setStatus(response.ok ? "Cover set" : "Cover failed");
    setOpen(false);

    if (response.ok) {
      router.refresh();
    }
  }

  function chooseTargetAlbum(actionLabel: string) {
    const targets = albumOptions.filter((album) => album.id !== albumId);

    if (!targets.length) {
      window.alert("No other album available.");
      return null;
    }

    const choices = targets
      .map((album, index) => `${index + 1}. ${album.title}`)
      .join("\n");
    const selected = window.prompt(`${actionLabel} to which album?\n\n${choices}`);
    const index = Number(selected) - 1;

    if (!Number.isInteger(index) || index < 0 || index >= targets.length) {
      return null;
    }

    return targets[index];
  }

  async function relocateMedia(mode: "move" | "copy") {
    const target = chooseTargetAlbum(mode === "move" ? "Move" : "Copy");

    if (!target) {
      return;
    }

    setStatus(mode === "move" ? "Moving..." : "Copying...");
    const response = await fetch(`/api/media/${mediaId}/relocate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, targetAlbumId: target.id })
    });

    setStatus(response.ok ? (mode === "move" ? "Moved" : "Copied") : "Action failed");
    setOpen(false);

    if (response.ok) {
      router.refresh();
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="absolute right-1.5 top-1.5" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-label="Media options"
        className="flex h-8 w-8 items-center justify-center rounded-md text-white drop-shadow transition hover:bg-white/10"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <EllipsisVertical className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-10 grid min-w-36 overflow-hidden rounded-md border border-border bg-card py-1 text-sm text-card-foreground shadow-xl">
          {canTag ? (
            <button className="flex items-center gap-2 px-3 py-2 text-left hover:bg-muted" onClick={addTag} type="button">
              <Tag className="h-4 w-4" />
              Tag
            </button>
          ) : null}
          {canSetCover ? (
            <button className="flex items-center gap-2 px-3 py-2 text-left hover:bg-muted" onClick={setAlbumCover} type="button">
              <ImagePlus className="h-4 w-4" />
              Set cover
            </button>
          ) : null}
          {canSetCover && albumOptions.length > 1 ? (
            <>
              <button className="flex items-center gap-2 px-3 py-2 text-left hover:bg-muted" onClick={() => relocateMedia("move")} type="button">
                <MoveRight className="h-4 w-4" />
                Move
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-left hover:bg-muted" onClick={() => relocateMedia("copy")} type="button">
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </>
          ) : null}
          <button
            className="flex items-center gap-2 px-3 py-2 text-left hover:bg-muted"
            onClick={() => {
              if (previewUrl) {
                window.open(previewUrl, "_blank", "noopener,noreferrer");
              }
              setOpen(false);
            }}
            type="button"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          {canRemove ? (
            <button className="flex items-center gap-2 px-3 py-2 text-left text-destructive hover:bg-muted" type="button">
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
      {status ? <span className="sr-only" role="status">{status}</span> : null}
    </div>
  );
}
