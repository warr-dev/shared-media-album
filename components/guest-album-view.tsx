"use client";

import { useState } from "react";

import { MediaGrid, type MediaAlbumOption, type MediaGridItem } from "@/components/media-grid";

export type GuestAlbumViewSection = {
  album: {
    id: string;
    title: string;
  };
  items: MediaGridItem[];
};

export function GuestAlbumView({
  albumSections,
  initialAlbumId
}: {
  albumSections: GuestAlbumViewSection[];
  initialAlbumId?: string | null;
}) {
  const initialAlbum = albumSections.find(({ album }) => album.id === initialAlbumId);
  const [selectedAlbumId, setSelectedAlbumId] = useState(
    initialAlbum?.album.id ?? albumSections[0]?.album.id ?? null
  );
  const selectedAlbum =
    albumSections.find(({ album }) => album.id === selectedAlbumId) ?? albumSections[0] ?? null;
  const albumOptions: MediaAlbumOption[] = albumSections.map(({ album }) => ({
    id: album.id,
    title: album.title
  }));

  return (
    <div className="grid gap-6">
      {albumSections.length > 1 ? (
        <div className="guest-stagger flex gap-3 overflow-x-auto pb-1">
          {albumSections.map(({ album }) => {
            const selected = album.id === selectedAlbum?.album.id;

            return (
              <button
                className={
                  selected
                    ? "guest-pressable h-12 min-w-32 rounded-full bg-black px-5 text-lg font-medium text-white shadow-md"
                    : "guest-pressable h-12 min-w-32 rounded-full bg-[#d9d9d9] px-5 text-lg font-medium text-[#777] hover:text-[#034326]"
                }
                key={album.id}
                onClick={() => setSelectedAlbumId(album.id)}
                type="button"
              >
                {album.title}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="guest-fade-up" key={selectedAlbum?.album.id}>
        <MediaGrid
          albumOptions={albumOptions}
          items={selectedAlbum?.items ?? []}
          variant="guest"
        />
      </div>
    </div>
  );
}
