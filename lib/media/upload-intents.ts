import { randomUUID } from "node:crypto";

import { createSignedPutUrl } from "@/lib/media/r2";
import type { MediaType } from "@/lib/db/schema-types";

const contentTypes: Record<MediaType, string> = {
  image: "image/jpeg",
  video: "video/mp4"
};

export function createMediaObjectKey({
  albumId,
  mediaType,
  filename
}: {
  albumId: string;
  mediaType: MediaType;
  filename: string;
}) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  return `albums/${albumId}/${mediaType}/${randomUUID()}-${safeName}`;
}

export async function createUploadIntent({
  albumId,
  mediaType,
  filename
}: {
  albumId: string;
  mediaType: MediaType;
  filename: string;
}) {
  const uploadId = randomUUID();
  const objectKey = createMediaObjectKey({ albumId, mediaType, filename });
  const uploadUrl = await createSignedPutUrl({
    objectKey,
    contentType: contentTypes[mediaType]
  });

  return { uploadId, objectKey, uploadUrl };
}
