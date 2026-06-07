"use client";

import { ChevronLeft, Images } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

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
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(
    initialAlbumId ?? null
  );

  const albumOptions: MediaAlbumOption[] = albumSections.map(({ album }) => ({
    id: album.id,
    title: album.title
  }));

  // Create virtual "All Photos" album combining all media items
  const allItems = albumSections.flatMap((section) => section.items);
  
  // Sort all items by upload time descending
  const sortedAllItems = [...allItems].sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );

  // Grouped sections including "All Photos" if there's more than one album
  const displaySections = albumSections.length > 1 
    ? [
        {
          album: { id: "all", title: "All Photos" },
          items: sortedAllItems
        },
        ...albumSections
      ]
    : albumSections;

  const selectedSection = displaySections.find(({ album }) => album.id === selectedAlbumId) ?? null;

  if (selectedSection) {
    return (
      <div className="grid gap-6">
        {/* Back Button and Album Title */}
        <div className="flex items-center gap-3">
          <button
            className="guest-pressable flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-[#034326] shadow-sm transition-all"
            onClick={() => setSelectedAlbumId(null)}
            type="button"
            aria-label="Back to albums list"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold leading-tight text-[#034326]">
              {selectedSection.album.title}
            </h2>
            <p className="text-xs font-semibold text-gray-500">
              {selectedSection.items.length} {selectedSection.items.length === 1 ? "media item" : "media items"}
            </p>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="guest-fade-up" key={selectedSection.album.id}>
          <MediaGrid
            albumOptions={albumOptions}
            items={selectedSection.items}
            variant="guest"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <h2 className="text-base font-bold text-center text-gray-500 mt-2">
        Albums for this Event
      </h2>

      {/* Grid of Album Cover Cards */}
      <div className="grid grid-cols-2 gap-4">
        {displaySections.map(({ album, items }) => {
          const coverItem = items.find((item) => item.preview_data_url);
          const count = items.length;

          return (
            <button
              key={album.id}
              onClick={() => setSelectedAlbumId(album.id)}
              className="guest-pressable text-left flex flex-col bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              type="button"
            >
              <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
                {coverItem?.preview_data_url ? (
                  <Image
                    src={coverItem.preview_data_url}
                    alt={album.title}
                    className="object-cover"
                    fill
                    sizes="(max-width: 430px) 50vw, 200px"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50">
                    <Images className="h-10 w-10 opacity-40" />
                  </div>
                )}
                <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-[2px]">
                  {count} {count === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="p-3.5 bg-white flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-sm text-[#034326] truncate leading-tight">
                  {album.title}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
