"use client";

import { Upload, Edit2, Check, X } from "lucide-react";
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
  isFadingOut?: boolean;
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
  shareSlug,
  currentNickname
}: {
  albumSections: GuestEventUploadSection[];
  canUpload: boolean;
  shareSlug: string;
  currentNickname?: string | null;
}) {
  const router = useRouter();
  const [selectedAlbumId, setSelectedAlbumId] = useState(albumSections[0]?.album.id ?? null);
  const [items, setItems] = useState<UploadState[]>([]);
  const selectedAlbum =
    albumSections.find(({ album }) => album.id === selectedAlbumId) ?? albumSections[0] ?? null;
  const albumOptions: MediaAlbumOption[] = albumSections.map(({ album }) => album);

  const [nickname, setNickname] = useState(currentNickname ?? "");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState(nickname);
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  async function handleSaveNickname() {
    if (!newNickname.trim() || newNickname.trim() === nickname) {
      setIsEditingNickname(false);
      return;
    }

    setIsSavingNickname(true);
    try {
      const res = await fetch(`/api/share/${shareSlug}/nickname`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname: newNickname })
      });
      if (res.ok) {
        const data = await res.json();
        setNickname(data.nickname);
        setIsEditingNickname(false);
        router.refresh();
      } else {
        alert("Failed to update nickname.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setIsSavingNickname(false);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !selectedAlbum) {
      return;
    }

    const selected = Array.from(files);
    setItems(selected.map((file) => ({ name: file.name, status: "queued" })));

    function triggerFadeTimeout(fileName: string) {
      setTimeout(() => {
        setItems((current) =>
          current.map((item) =>
            item.name === fileName ? { ...item, isFadingOut: true } : item
          )
        );
      }, 5000);

      setTimeout(() => {
        setItems((current) => current.filter((item) => item.name !== fileName));
      }, 6000);
    }

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
        triggerFadeTimeout(file.name);
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
        triggerFadeTimeout(file.name);
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
        triggerFadeTimeout(file.name);
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
        triggerFadeTimeout(file.name);
      }
    }

    router.refresh();
  }

  return (
    <section className="guest-screen mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-white text-[#034326] shadow-sm flex flex-col">
      {/* Top Banner with Background Image */}
      <div
        className="relative flex min-h-[42svh] flex-col overflow-hidden bg-[#7f7b74] px-5 pb-6 pt-10 text-white shrink-0"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop')" 
          }}
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Text Overlay */}
        <div className="guest-stagger relative mt-auto grid gap-5 text-center z-10">
          <p className="mx-auto max-w-[21rem] px-2 text-[16px] font-bold leading-6 text-white drop-shadow-md">
            Got a photo from the wedding? Any picture will do even the
            bloopers, selfies, or your plate of food!
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <label
              className={
                canUpload
                  ? "guest-pressable grid h-14 min-w-0 cursor-pointer place-items-center rounded-xl bg-[#7fa08e] hover:bg-[#8eb09e] px-3 text-[19px] font-semibold text-white shadow-md transition-all"
                  : "grid h-14 min-w-0 place-items-center rounded-xl bg-[#7fa08e]/60 px-3 text-[19px] font-semibold text-white/60"
              }
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <Upload className="h-6 w-6 shrink-0" />
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
              className="guest-pressable grid h-14 min-w-0 place-items-center rounded-xl bg-black hover:bg-black/90 px-3 text-[18px] font-semibold leading-tight text-white shadow-md transition-all"
              href={`/a/${shareSlug}?view=album`}
            >
              Gallery
            </Link>
          </div>

          {/* File Upload Progress Bars */}
          {items.length ? (
            <ul className="grid gap-2 text-sm text-left">
              {items.map((item) => {
                const isUploaded = item.status === "uploaded";
                const isUploading = item.status === "uploading";
                const isFailed = item.status === "failed";
                
                return (
                  <li
                    className={`relative overflow-hidden rounded-lg h-10 flex items-center justify-between px-4 text-xs font-bold text-black bg-white/70 border border-black/5 transition-opacity duration-1000 ${
                      item.isFadingOut ? "opacity-0" : "opacity-100"
                    }`}
                    key={item.name}
                  >
                    {/* Green Progress Fill */}
                    <div 
                      className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                        isUploaded 
                          ? "w-full bg-[#00ff40]" 
                          : isUploading 
                            ? "w-2/3 bg-[#00ff40] animate-pulse" 
                            : isFailed
                              ? "w-full bg-red-400"
                              : "w-0"
                      }`}
                    />
                    
                    <span className="relative z-10 truncate max-w-[70%]">{item.name}</span>
                    <span className="relative z-10">
                      {item.message ??
                        (isUploaded
                          ? "Uploaded!"
                          : isUploading
                            ? "Uploading..."
                            : item.status)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Bottom Panel containing Album Switcher and Gallery Grid */}
      <div className="guest-panel-rise flex-1 -mt-5 rounded-t-[22px] bg-white px-4 pb-8 pt-6 z-20">
        <div className="guest-fade-up grid gap-6">
          {/* Nickname Editor Widget */}
          {nickname && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm">
              {isEditingNickname ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-black text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#7fa08e]"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    disabled={isSavingNickname}
                    maxLength={30}
                    placeholder="Enter nickname"
                    type="text"
                  />
                  <button
                    className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                    onClick={handleSaveNickname}
                    disabled={isSavingNickname}
                    type="button"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    className="h-8 w-8 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center justify-center shrink-0"
                    onClick={() => {
                      setNewNickname(nickname);
                      setIsEditingNickname(false);
                    }}
                    disabled={isSavingNickname}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-gray-600 text-xs flex items-center">
                    Posting as: <span className="text-[#034326] font-bold text-sm bg-[#e6f2eb] px-2.5 py-1 rounded-md ml-1.5">{nickname}</span>
                  </p>
                  <button
                    className="flex items-center gap-1 text-xs font-bold text-[#7fa08e] hover:text-[#5d806d] transition-colors"
                    onClick={() => setIsEditingNickname(true)}
                    type="button"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </>
              )}
            </div>
          )}

          {albumSections.length > 0 ? (
            <div className="grid gap-4">
              <p className="text-[15px] font-medium leading-normal text-[#555] text-center">
                Choose the album where each photo or video belongs.
              </p>
              <div className="guest-stagger flex flex-wrap justify-center gap-2">
                {albumSections.map(({ album }) => {
                  const selected = album.id === selectedAlbum?.album.id;

                  return (
                    <button
                      className={
                        selected
                          ? "guest-pressable h-10 px-6 rounded-full bg-black text-sm font-bold text-white shadow-md transition-all"
                          : "guest-pressable h-10 px-6 rounded-full bg-[#efefef] text-sm font-bold text-[#555] transition-all"
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

          <div className="mt-8 flex justify-center pb-4 border-t border-gray-100 pt-6">
            <Link
              className="guest-pressable inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#034326] px-6 text-sm font-bold text-white shadow-md hover:bg-[#034326]/90 transition-all"
              href={`/a/${shareSlug}?view=message`}
            >
              ✍️ Leave a message
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
