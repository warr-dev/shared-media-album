"use client";

import { Images } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { MediaGrid, type MediaAlbumOption, type MediaGridItem } from "@/components/media-grid";

export function AlbumGallerySection({
  title,
  eyebrow,
  meta,
  action,
  items,
  coverMediaId,
  initiallyExpanded = true,
  albumOptions = [],
  albumCardLayout = false
}: {
  title: string;
  eyebrow?: string;
  meta?: ReactNode;
  action?: ReactNode;
  items: MediaGridItem[];
  coverMediaId?: string | null;
  initiallyExpanded?: boolean;
  albumOptions?: MediaAlbumOption[];
  albumCardLayout?: boolean;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const cover =
    items.find((item) => item.id === coverMediaId && item.preview_data_url) ??
    items.find((item) => item.preview_data_url);
  const coverStack = (
    <>
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
        ) : null}
        {!cover?.preview_data_url ? (
          <div className="absolute inset-0 grid place-items-center">
            <Images className="h-10 w-10 text-muted-foreground" />
          </div>
        ) : null}
        {eyebrow ? (
          <p className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
            {eyebrow}
          </p>
        ) : null}
      </div>
    </>
  );

  if (albumCardLayout) {
    if (expanded) {
      return (
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm sm:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <button
              className="grid min-w-0 flex-1 grid-cols-[5rem_1fr] items-center gap-3 text-left"
              onClick={() => setExpanded(false)}
              type="button"
            >
              <div className="relative h-20 w-20">{coverStack}</div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">{title}</h2>
                {meta ? <div className="mt-0.5 text-sm text-muted-foreground">{meta}</div> : null}
              </div>
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {action}
              <button
                className="inline-flex h-9 items-center rounded-md bg-transparent px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => setExpanded(false)}
                type="button"
              >
                Back to albums
              </button>
            </div>
          </div>
          <div className="border-t border-border p-1 sm:p-2">
            <MediaGrid albumOptions={albumOptions} items={items} />
          </div>
        </section>
      );
    }

    return (
      <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="grid gap-3 p-2">
          <button
            className="grid gap-3 text-left"
            onClick={() => setExpanded(true)}
            type="button"
          >
            <div className="relative aspect-square">{coverStack}</div>
            <div className="min-w-0 px-1 pb-1">
              <h2 className="truncate text-base font-semibold">{title}</h2>
              {meta ? <div className="mt-0.5 text-sm text-muted-foreground">{meta}</div> : null}
            </div>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <div className="relative min-h-40 bg-muted sm:min-h-52">
        {cover?.preview_data_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            src={cover.preview_data_url}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
        <div className="relative flex min-h-40 flex-col justify-end gap-4 p-4 text-white sm:min-h-52 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-medium uppercase tracking-wide text-white/75">{eyebrow}</p>
            ) : null}
            <h2 className="mt-1 truncate text-2xl font-semibold sm:text-3xl">{title}</h2>
            {meta ? <div className="mt-1 text-sm text-white/75">{meta}</div> : null}
          </div>
          {action}
        </div>
      </div>
      {expanded ? (
        <div className="p-1 sm:p-2">
          <MediaGrid albumOptions={albumOptions} items={items} />
        </div>
      ) : null}
    </section>
  );
}
