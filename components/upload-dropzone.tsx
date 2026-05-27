"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UploadState = {
  name: string;
  status: "queued" | "uploading" | "uploaded" | "failed";
  message?: string;
};

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
      resolve(typeof reader.result === "string" ? reader.result : null);
    });
    reader.addEventListener("error", () => resolve(null));
    reader.readAsDataURL(file);
  });
}

export function UploadDropzone({
  albumId,
  compact = false
}: {
  albumId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<UploadState[]>([]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) {
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
            albumId,
            filename: file.name,
            mediaType,
            byteSize: file.size
          })
        });

        if (!intentResponse.ok) {
          throw new Error("Upload intent failed");
        }

        const intent = (await intentResponse.json()) as {
          uploadId: string;
          objectKey: string;
          uploadUrl: string;
        };

        if (!intent.uploadUrl.startsWith("dev://")) {
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
        const confirmResponse = await fetch(`/api/albums/${albumId}/media`, {
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
          throw new Error("Media confirmation failed");
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
    <section className={compact ? "grid w-full gap-3 sm:w-auto" : "grid gap-4 rounded-md border border-border bg-card p-4"}>
      {!compact ? (
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Upload media</h2>
            <p className="text-sm text-muted-foreground">Add photos or videos to this event album.</p>
          </div>
        </div>
      ) : null}
      <label
        className={
          compact
            ? "inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 sm:w-auto"
            : "grid cursor-pointer gap-2 rounded-md border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground"
        }
      >
        {compact ? (
          <>
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </>
        ) : (
          <>
            <span className="font-medium text-foreground">Choose files</span>
            <span>Images and videos are supported.</span>
          </>
        )}
        <input
          accept="image/*,video/*"
          className="sr-only"
          multiple
          onChange={(event) => uploadFiles(event.currentTarget.files)}
          type="file"
        />
      </label>
      {items.length ? (
        <ul className="grid gap-2 text-sm">
          {items.map((item) => (
            <li className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2" key={item.name}>
              <span className="min-w-0 truncate">{item.name}</span>
              <span className={item.status === "failed" ? "text-destructive" : "text-muted-foreground"}>
                {item.message ?? item.status}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
