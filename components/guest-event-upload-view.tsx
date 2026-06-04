"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MediaGrid, type MediaAlbumOption, type MediaGridItem } from "@/components/media-grid";
import { createSupabaseBrowserClient } from "@/lib/db/supabase-browser";

export type GuestEventUploadAlbum = {
  id: string;
  title: string;
};

export type GuestEventUploadSection = {
  album: GuestEventUploadAlbum;
  items: MediaGridItem[];
};

type UploadState = {
  name: string;
  status: "queued" | "uploading" | "uploaded" | "failed";
  message?: string;
};

const maxUploadBytes = 1024 * 1024 * 50;

function getMediaType(file: File) {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return null;
}

function readImagePreview(file: File) {
  if (!file.type.startsWith("image/")) {
    return Promise.resolve(null);
  }

  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        resolve(null);
        return;
      }

      const image = new window.Image();

      image.addEventListener("load", () => {
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");

        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      });
      image.addEventListener("error", () => resolve(null));
      image.src = reader.result;
    });
    reader.addEventListener("error", () => resolve(null));
    reader.readAsDataURL(file);
  });
}

async function readErrorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;

  return body?.error ?? fallback;
}

function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

export function GuestEventUploadView({
  albumSections,
  canUpload,
  shareSlug
}: {
  albumSections: GuestEventUploadSection[];
  canUpload: boolean;
  shareSlug: string;
}) {
  const router = useRouter();
  const [selectedAlbumId, setSelectedAlbumId] = useState(albumSections[0]?.album.id ?? null);
  const [items, setItems] = useState<UploadState[]>([]);
  const selectedAlbum =
    albumSections.find(({ album }) => album.id === selectedAlbumId) ?? albumSections[0] ?? null;
  const albumOptions: MediaAlbumOption[] = albumSections.map(({ album }) => album);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !selectedAlbum) {
      return;
    }

    const selected = Array.from(files);
    setItems(selected.map((file) => ({ name: file.name, status: "queued" })));

    for (const file of selected) {
      const mediaType = getMediaType(file);

      if (!mediaType) {
        setItems((current) =>
          current.map((item) =>
            item.name === file.name
              ? { ...item, status: "failed", message: "Unsupported file type" }
              : item
          )
        );
        continue;
      }

      if (file.size > maxUploadBytes) {
        setItems((current) =>
          current.map((item) =>
            item.name === file.name
              ? {
                  ...item,
                  status: "failed",
                  message: `File is too large. Max ${formatMegabytes(maxUploadBytes)}.`
                }
              : item
          )
        );
        continue;
      }

      setItems((current) =>
        current.map((item) =>
          item.name === file.name ? { ...item, status: "uploading" } : item
        )
      );

      try {
        const intentResponse = await fetch("/api/upload-intents", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            albumId: selectedAlbum.album.id,
            filename: file.name,
            mediaType,
            byteSize: file.size
          })
        });

        if (!intentResponse.ok) {
          throw new Error(await readErrorMessage(intentResponse, "Upload intent failed"));
        }

        const intent = (await intentResponse.json()) as {
          uploadId: string;
          objectKey: string;
          uploadUrl: string;
          uploadToken?: string;
          storageProvider?: "supabase";
          bucket?: string;
        };

        if (intent.storageProvider === "supabase") {
          if (!intent.uploadToken || !intent.bucket) {
            throw new Error("Supabase upload intent is incomplete");
          }

          const { error } = await createSupabaseBrowserClient()
            .storage
            .from(intent.bucket)
            .uploadToSignedUrl(intent.objectKey, intent.uploadToken, file, {
              contentType: file.type,
              upsert: false
            });

          if (error) {
            throw new Error(error.message);
          }
        } else if (!intent.uploadUrl.startsWith("dev://")) {
          const uploadResponse = await fetch(intent.uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "content-type": file.type }
          });

          if (!uploadResponse.ok) {
            throw new Error("Storage upload failed");
          }
        }

        const previewDataUrl = await readImagePreview(file);
        const confirmResponse = await fetch(`/api/albums/${selectedAlbum.album.id}/media`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uploadId: intent.uploadId,
            objectKey: intent.objectKey,
            mediaType,
            filename: file.name,
            previewDataUrl
          })
        });

        if (!confirmResponse.ok) {
          throw new Error(await readErrorMessage(confirmResponse, "Media confirmation failed"));
        }

        setItems((current) =>
          current.map((item) =>
            item.name === file.name ? { ...item, status: "uploaded" } : item
          )
        );
      } catch (error) {
        setItems((current) =>
          current.map((item) =>
            item.name === file.name
              ? {
                  ...item,
                  status: "failed",
                  message: error instanceof Error ? error.message : "Upload failed"
                }
              : item
          )
        );
      }
    }

    router.refresh();
  }

  return (
    <section className="guest-screen mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-[#e9e9e9] text-[#034326] shadow-sm">
      <div
        className="relative flex min-h-[45svh] flex-col overflow-hidden bg-[#7f7b74] px-4 pb-5 pt-9 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.14),transparent_20%),linear-gradient(135deg,rgba(40,35,31,0.35),rgba(120,114,104,0.2)_42%,rgba(20,20,20,0.55))]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="relative ml-4 grid h-20 w-20 shrink-0 place-items-center rounded-full bg-white text-[#a86618] shadow-sm">
          <span className="font-serif text-[32px] leading-none">R</span>
          <span className="absolute text-[24px] italic">&amp;</span>
          <span className="absolute bottom-4 right-4 font-serif text-[32px] leading-none">M</span>
        </div>
        <div className="guest-stagger relative mt-auto grid gap-4 text-center">
          <p className="mx-auto max-w-[21rem] px-3 text-[17px] font-medium leading-6">
            Got a photo from the wedding? Any picture will do even the
            bloopers, selfies, or your plate of food!
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={
                canUpload
                  ? "guest-pressable grid h-14 min-w-0 cursor-pointer place-items-center rounded-lg bg-[#a9cfbd] px-3 text-[19px] font-semibold text-[#034326]"
                  : "grid h-14 min-w-0 place-items-center rounded-lg bg-[#a9cfbd]/60 px-3 text-[19px] font-semibold text-[#034326]/60"
              }
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <Upload className="h-7 w-7 shrink-0" />
                Upload
              </span>
              <input
                accept="image/*,video/*"
                className="sr-only"
                disabled={!canUpload}
                multiple
                onChange={(event) => uploadFiles(event.currentTarget.files)}
                type="file"
              />
            </label>
            <Link
              className="guest-pressable grid h-14 min-w-0 place-items-center rounded-lg bg-black px-3 text-[18px] font-semibold leading-tight text-white"
              href={`/a/${shareSlug}?view=message`}
            >
              Leave a message
            </Link>
          </div>
          {items.length ? (
            <ul className="grid gap-2 text-sm">
              {items.map((item) => (
                <li
                  className={
                    item.status === "uploaded"
                      ? "grid gap-1 rounded-md bg-[#0aff3f] px-4 py-2 text-left text-black"
                      : "grid gap-1 rounded-md bg-[#d9d9d9] px-4 py-2 text-left text-black"
                  }
                  key={item.name}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{item.name}</span>
                    <span>
                      {item.message ??
                        (item.status === "uploaded"
                          ? "Uploaded!"
                          : item.status === "uploading"
                            ? "Uploading..."
                            : item.status)}
                    </span>
                  </div>
                  {item.status === "uploading" ? (
                    <span className="h-2 overflow-hidden rounded-full bg-white/70">
                      <span className="block h-full w-2/3 animate-pulse rounded-full bg-[#0aff3f]" />
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="guest-panel-rise -mt-5 rounded-t-[22px] bg-[#e9e9e9] px-4 pb-6 pt-6">
        <div className="guest-fade-up grid gap-6">
          {albumSections.length > 1 ? (
            <div className="grid gap-4">
              <p className="text-[20px] leading-7 text-[#444]">
                Choose the album where each photo or video belongs.
              </p>
              <div className="guest-stagger grid grid-cols-3 gap-3">
                {albumSections.map(({ album }) => {
                  const selected = album.id === selectedAlbum?.album.id;

                  return (
                    <button
                      className={
                        selected
                          ? "guest-pressable h-14 min-w-0 rounded-full bg-black px-3 text-[18px] font-medium text-white shadow-md"
                          : "guest-pressable h-14 min-w-0 rounded-full bg-[#d1d1d1] px-3 text-[18px] font-medium text-[#777]"
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

          <MediaGrid
            albumOptions={albumOptions}
            items={selectedAlbum?.items ?? []}
            variant="guest"
          />
        </div>
      </div>
    </section>
  );
}
