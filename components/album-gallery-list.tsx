"use client";

import { Images } from "lucide-react";
import { useState } from "react";

import { MediaGrid, type MediaAlbumOption, type MediaGridItem } from "@/components/media-grid";
import { UploadDropzone } from "@/components/upload-dropzone";

export type AlbumGalleryListItem = {
  id: string;
  title: string;
  eyebrow?: string;
  meta?: string;
  coverMediaId?: string | null;
  uploadAlbumId?: string;
  items: MediaGridItem[];
  albumOptions?: MediaAlbumOption[];
};

function AlbumCover({
  album,
  compact = false
}: {
  album: AlbumGalleryListItem;
  compact?: boolean;
}) {
  const cover =
    album.items.find((item) => item.id === album.coverMediaId && item.preview_data_url) ??
    album.items.find((item) => item.preview_data_url);

  return (
    <div className={compact ? "relative h-20 w-20 shrink-0" : "relative aspect-square"}>
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-[5px] border border-border bg-muted" />
      <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-[5px] border border-border bg-card shadow-sm" />
      <div className="absolute inset-0 overflow-hidden rounded-[5px] bg-muted shadow-sm">
        {cover?.preview_data_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-200 hover:scale-[1.02]"
            src={cover.preview_data_url}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <Images className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        {album.eyebrow ? (
          <p className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
            {album.eyebrow}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AlbumGalleryList({ albums }: { albums: AlbumGalleryListItem[] }) {
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? null;

  if (selectedAlbum) {
    return (
      <section className="grid gap-6">
        <button
          className="w-fit rounded-md bg-transparent text-sm font-medium text-muted-foreground transition hover:text-foreground"
          onClick={() => setSelectedAlbumId(null)}
          type="button"
        >
          Back to albums
        </button>

        <section className="rounded-md border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <AlbumCover album={selectedAlbum} compact />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {selectedAlbum.eyebrow ?? "Album"}
                </p>
                <h2 className="truncate text-xl font-semibold">{selectedAlbum.title}</h2>
                {selectedAlbum.meta ? (
                  <p className="mt-1 text-sm text-muted-foreground">{selectedAlbum.meta}</p>
                ) : null}
              </div>
            </div>
            {selectedAlbum.uploadAlbumId ? (
              <div className="w-full sm:w-auto">
                <UploadDropzone albumId={selectedAlbum.uploadAlbumId} compact />
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-md border border-border bg-card p-1 shadow-sm sm:p-2">
          <MediaGrid albumOptions={selectedAlbum.albumOptions ?? []} items={selectedAlbum.items} />
        </section>
      </section>
    );
  }

  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album) => (
        <button
          className="overflow-hidden rounded-md border border-border bg-card p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          key={album.id}
          onClick={() => setSelectedAlbumId(album.id)}
          type="button"
        >
          <AlbumCover album={album} />
          <div className="min-w-0 px-1 pb-1 pt-3">
            <h2 className="truncate text-base font-semibold">{album.title}</h2>
            {album.meta ? <p className="mt-0.5 text-sm text-muted-foreground">{album.meta}</p> : null}
          </div>
        </button>
      ))}
    </section>
  );
}
