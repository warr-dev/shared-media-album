"use client";

import { ChevronLeft, ChevronRight, Download, ImageIcon, X, Video } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";


import { MediaOptionsMenu } from "@/components/media-options-menu";

export type MediaGridItem = {
  id: string;
  album_id: string;
  media_type: "image" | "video";
  original_filename?: string;
  preview_data_url?: string | null;
  nickname?: string;
  uploaded_at: string;
  can_tag?: boolean;
  can_remove?: boolean;
  can_set_cover?: boolean;
};

export type MediaAlbumOption = {
  id: string;
  title: string;
};

export function MediaGrid({
  items,
  albumOptions = [],
  variant = "default"
}: {
  items: MediaGridItem[];
  albumOptions?: MediaAlbumOption[];
  variant?: "default" | "guest";
}) {
  const [previewItem, setPreviewItem] = useState<MediaGridItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const previewIndex = previewItem
    ? items.findIndex((item) => item.id === previewItem.id)
    : -1;
  const canNavigate = items.length > 1 && previewIndex >= 0;

  function openPrevious() {
    if (!canNavigate) {
      return;
    }

    setPreviewItem(items[(previewIndex - 1 + items.length) % items.length]);
  }

  function openNext() {
    if (!canNavigate) {
      return;
    }

    setPreviewItem(items[(previewIndex + 1) % items.length]);
  }

  useEffect(() => {
    if (!previewItem) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewItem(null);
      }
      if (event.key === "ArrowLeft") {
        setPreviewItem((current) => {
          if (!current || items.length <= 1) {
            return current;
          }

          const currentIndex = items.findIndex((item) => item.id === current.id);
          return items[(currentIndex - 1 + items.length) % items.length];
        });
      }
      if (event.key === "ArrowRight") {
        setPreviewItem((current) => {
          if (!current || items.length <= 1) {
            return current;
          }

          const currentIndex = items.findIndex((item) => item.id === current.id);
          return items[(currentIndex + 1) % items.length];
        });
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [items, previewItem]);

  if (!items.length) {
    return (
      <section className="grid min-h-44 place-items-center rounded-md border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
        No media yet.
      </section>
    );
  }

  return (
    <section
      className={
        variant === "guest"
          ? "guest-stagger grid grid-cols-3 gap-1"
          : "grid auto-rows-[6.5rem] grid-cols-2 gap-1 sm:auto-rows-[8.5rem] sm:grid-cols-4 lg:auto-rows-[9.5rem] lg:grid-cols-6"
      }
    >
      {items.map((item) => {
        const Icon = item.media_type === "video" ? Video : ImageIcon;

        return (
          <article
            className={
              variant === "guest"
                ? "group relative aspect-square overflow-hidden rounded-[3px] bg-muted transition duration-200 ease-out hover:z-10 hover:scale-[1.015] hover:shadow-lg"
                : "group relative overflow-hidden rounded-[3px] bg-muted transition duration-200 ease-out hover:z-10 hover:scale-[1.015] hover:shadow-lg"
            }
            key={item.id}
          >
            <button
              aria-label={`Preview ${item.original_filename ?? item.media_type}`}
              className="absolute inset-0 flex items-center justify-center"
              onClick={() => setPreviewItem(item)}
              type="button"
            >
              {item.preview_data_url ? (
                <Image
                  alt={item.original_filename ?? "Uploaded media"}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  src={item.preview_data_url}
                  unoptimized
                />
              ) : (
                <Icon className="h-8 w-8 text-muted-foreground" />
              )}
            </button>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
              <p className="truncate text-xs font-medium">
                {item.original_filename ?? `${item.media_type} upload`}
              </p>
              <p className="truncate text-[11px] text-white/80">
                {item.nickname ? `By ${item.nickname}` : "Uploaded"}
              </p>
            </div>

            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/45 to-transparent opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100" />

            {item.media_type === "video" && (
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white z-10 pointer-events-none">
                <Video className="h-3 w-3 fill-current" />
                <span>
                  {item.id.charCodeAt(0) % 2 === 0 ? "01:02" : item.id.charCodeAt(0) % 3 === 0 ? "02:15" : "00:24"}
                </span>
              </div>
            )}

            <MediaOptionsMenu
              albumId={item.album_id}
              albumOptions={albumOptions}
              canRemove={item.can_remove}
              canSetCover={item.can_set_cover}
              canTag={item.can_tag}
              mediaId={item.id}
              previewUrl={item.preview_data_url}
            />
          </article>
        );
      })}

      {isMounted && previewItem && variant === "guest"
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex flex-col bg-black/95 px-6 pb-8 pt-16 text-white justify-between"
            onClick={() => setPreviewItem(null)}
            role="presentation"
          >
            {/* Floating X Close Button */}
            <button
              aria-label="Close preview"
              className="absolute top-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 border border-white/20 text-white transition hover:bg-black/70 shadow-lg"
              onClick={() => setPreviewItem(null)}
              type="button"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Main Media Preview Box */}
            <div className="relative flex-1 w-full min-h-0 flex items-center justify-center" onClick={(event) => event.stopPropagation()} role="presentation">
              <div className="relative h-full w-full overflow-hidden rounded-md bg-transparent flex items-center justify-center">
                {previewItem.preview_data_url ? (
                  <Image
                    alt={previewItem.original_filename ?? "Media preview"}
                    className="object-contain"
                    fill
                    sizes="100vw"
                    src={previewItem.preview_data_url}
                    unoptimized
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    {previewItem.media_type === "video" ? (
                      <Video className="h-12 w-12 text-white/60" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-white/60" />
                    )}
                  </div>
                )}
              </div>

              {/* Lightbox Navigation Chevrons */}
              {canNavigate ? (
                <>
                  <button
                    aria-label="Previous media"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    onClick={(event) => {
                      event.stopPropagation();
                      openPrevious();
                    }}
                    type="button"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    aria-label="Next media"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    onClick={(event) => {
                      event.stopPropagation();
                      openNext();
                    }}
                    type="button"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              ) : null}
            </div>

            {/* Horizontal Thumbnails row */}
            <div 
              className="mt-6 flex shrink-0 justify-center gap-2 overflow-x-auto py-2"
              onClick={(event) => event.stopPropagation()}
            >
              {items.map((item) => (
                <button
                  aria-label={`Open ${item.original_filename ?? item.media_type}`}
                  className={
                    item.id === previewItem.id
                      ? "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 border-white bg-white/10"
                      : "relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-white/10 opacity-50 transition hover:opacity-90"
                  }
                  key={item.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPreviewItem(item);
                  }}
                  type="button"
                >
                  {item.preview_data_url ? (
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="80px"
                      src={item.preview_data_url}
                      unoptimized
                    />
                  ) : null}
                </button>
              ))}
            </div>

            {/* Bottom Download Button */}
            {previewItem.preview_data_url ? (
              <div 
                className="mt-6 shrink-0"
                onClick={(event) => event.stopPropagation()}
              >
                <a
                  className="guest-pressable w-full inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white text-base font-bold text-black hover:bg-white/90 shadow-lg"
                  download={previewItem.original_filename ?? "wedding-media"}
                  href={previewItem.preview_data_url}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Download className="h-5 w-5" />
                  Download
                </a>
              </div>
            ) : null}
          </div>,
          document.body
        )
      : null}

    {isMounted && previewItem && variant !== "guest"
      ? createPortal(
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-3 pb-20 sm:p-6"
            onClick={() => setPreviewItem(null)}
            role="presentation"
          >
            <button
              aria-label="Close preview"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20"
              onClick={() => setPreviewItem(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            {canNavigate ? (
              <>
                <button
                  aria-label="Previous media"
                  className="absolute bottom-5 left-1/2 z-10 flex h-11 w-11 -translate-x-[3.25rem] items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-3 sm:top-1/2 sm:-translate-x-0 sm:-translate-y-1/2"
                  onClick={(event) => {
                    event.stopPropagation();
                    openPrevious();
                  }}
                  type="button"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  aria-label="Next media"
                  className="absolute bottom-5 left-1/2 z-10 flex h-11 w-11 translate-x-[0.5rem] items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-auto sm:right-3 sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0"
                  onClick={(event) => {
                    event.stopPropagation();
                    openNext();
                  }}
                  type="button"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : null}
            <div className="relative max-h-full w-full max-w-6xl" onClick={(event) => event.stopPropagation()} role="presentation">
              <div className="relative min-h-[52vh] overflow-hidden rounded-md bg-black sm:min-h-[65vh]">
                {previewItem.preview_data_url ? (
                  <Image
                    alt={previewItem.original_filename ?? "Media preview"}
                    className="object-contain"
                    fill
                    sizes="100vw"
                    src={previewItem.preview_data_url}
                    unoptimized
                  />
                ) : (
                  <div className="grid min-h-[65vh] place-items-center">
                    {previewItem.media_type === "video" ? (
                      <Video className="h-12 w-12 text-white/60" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-white/60" />
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 grid gap-1 text-sm text-white sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
                <p className="min-w-0 truncate font-medium">
                  {previewItem.original_filename ?? `${previewItem.media_type} upload`}
                </p>
                <p className="text-white/70">
                  {previewItem.nickname ? `By ${previewItem.nickname}` : "Uploaded"}
                  {canNavigate ? ` · ${previewIndex + 1} of ${items.length}` : ""}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )
      : null}
    </section>
  );
}
