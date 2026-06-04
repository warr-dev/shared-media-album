"use client";

import { useState } from "react";

import { UploadDropzone } from "@/components/upload-dropzone";

export type GuestUploadAlbum = {
  id: string;
  title: string;
};

export function GuestUploadView({
  albums,
  canUpload
}: {
  albums: GuestUploadAlbum[];
  canUpload: boolean;
}) {
  const [selectedAlbumId, setSelectedAlbumId] = useState(albums[0]?.id ?? null);
  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? albums[0] ?? null;

  if (!canUpload || !selectedAlbum) {
    return (
      <div className="rounded-lg border border-[#d9d9d9] bg-white/80 p-5 text-[#333]">
        Uploading is not available for this event link.
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {albums.length > 1 ? (
        <div className="guest-fade-up grid gap-4 text-left">
          <p className="text-xl text-[#444]">
            Choose the album where each photo or video belongs.
          </p>
          <div className="guest-stagger flex gap-3 overflow-x-auto pb-1">
            {albums.map((album) => {
              const selected = album.id === selectedAlbum.id;

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
        </div>
      ) : null}

      <div className="guest-fade-up" key={selectedAlbum.id}>
        <UploadDropzone albumId={selectedAlbum.id} variant="guest" />
      </div>
    </div>
  );
}
