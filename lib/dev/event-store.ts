import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

import type { CreateEventInput, CreateShareAccessInput } from "@/lib/validation/event";
import { buildNickname } from "@/lib/nicknames/assign";
import { createShareLink } from "@/lib/db/queries/share-access";

type DevShareAccess = {
  id: string;
  event_id: string;
  album_id: string;
  slug: string;
  state: "active" | "disabled" | "expired";
  permissions: Array<"view" | "upload" | "tag">;
  created_at: string;
  expires_at: string | null;
};

type DevEvent = {
  id: string;
  owner_id: string;
  name: string;
  event_type: CreateEventInput["eventType"];
  starts_at: string;
  ends_at: string | null;
  description: string | null;
  location: string | null;
  created_at: string;
};

type DevAlbum = {
  id: string;
  event_id: string;
  title: string;
  cover_media_id?: string | null;
};

type DevNickname = {
  id: string;
  event_id: string;
  album_id: string;
  display_name: string;
  session_key_hash: string;
};

type DevParticipant = {
  id: string;
  event_id: string;
  album_id: string;
  nickname_id: string;
};

type DevMediaItem = {
  id: string;
  album_id: string;
  event_id: string;
  uploader_participant_id: string;
  nickname: string;
  media_type: "image" | "video";
  original_object_key: string;
  original_filename: string;
  preview_data_url: string | null;
  upload_status: "uploaded";
  uploaded_at: string;
};

type DevStore = {
  events: DevEvent[];
  albums: DevAlbum[];
  shares: DevShareAccess[];
  nicknames: DevNickname[];
  participants: DevParticipant[];
  media: DevMediaItem[];
};

const storePath = join(process.cwd(), ".data", "dev-store.json");
const demoOwnerId = "00000000-0000-4000-8000-000000000001";

function emptyStore(): DevStore {
  return {
    events: [],
    albums: [],
    shares: [],
    nicknames: [],
    participants: [],
    media: []
  };
}

async function readStore(): Promise<DevStore> {
  try {
    const parsed = JSON.parse(await readFile(storePath, "utf8")) as Partial<DevStore>;
    return {
      ...emptyStore(),
      ...parsed,
      media: parsed.media ?? []
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: DevStore) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
}

function createSlug() {
  return randomBytes(9).toString("base64url");
}

export async function createDevEvent(input: CreateEventInput) {
  const store = await readStore();
  const event: DevEvent = {
    id: randomUUID(),
    owner_id: demoOwnerId,
    name: input.name,
    event_type: input.eventType,
    starts_at: input.startsAt,
    ends_at: input.endsAt ?? null,
    description: input.description ?? null,
    location: input.location ?? null,
    created_at: new Date().toISOString()
  };
  const album: DevAlbum = {
    id: randomUUID(),
    event_id: event.id,
    title: input.albumTitle,
    cover_media_id: null
  };
  const share = createDevShareRecord(event.id, album.id, {
    permissions: ["view", "upload", "tag"]
  });

  store.events.push(event);
  store.albums.push(album);
  store.shares.push(share);
  await writeStore(store);

  return { event, album, share };
}

function createDevShareRecord(
  eventId: string,
  albumId: string,
  input: CreateShareAccessInput
): DevShareAccess {
  return {
    id: randomUUID(),
    event_id: eventId,
    album_id: albumId,
    slug: createSlug(),
    state: "active",
    permissions: input.permissions,
    created_at: new Date().toISOString(),
    expires_at: input.expiresAt ?? null
  };
}

export async function createDevShareAccess(
  eventId: string,
  input: CreateShareAccessInput
) {
  const store = await readStore();
  const album = store.albums.find((item) => item.event_id === eventId);

  if (!album) {
    return null;
  }

  const share = createDevShareRecord(eventId, album.id, input);
  store.shares.push(share);
  await writeStore(store);

  return share;
}

export async function createDevAlbum(eventId: string, title: string) {
  const store = await readStore();
  const event = store.events.find((item) => item.id === eventId);

  if (!event) {
    return null;
  }

  const album: DevAlbum = {
    id: randomUUID(),
    event_id: eventId,
    title,
    cover_media_id: null
  };

  store.albums.push(album);
  await writeStore(store);

  return album;
}

export async function getDevEventDetail(eventId: string) {
  const store = await readStore();
  const event = store.events.find((item) => item.id === eventId);

  if (!event) {
    return null;
  }

  const albums = store.albums.filter((item) => item.event_id === event.id);
  const album = albums[0] ?? null;
  const share =
    store.shares
      .filter((item) => item.event_id === event.id && item.state === "active")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

  return { event, album, albums, share };
}

export async function getDevShareLanding(slug: string) {
  const store = await readStore();
  const share = store.shares.find((item) => item.slug === slug && item.state === "active");

  if (!share) {
    return null;
  }

  const event = store.events.find((item) => item.id === share.event_id) ?? null;
  const album = store.albums.find((item) => item.id === share.album_id) ?? null;
  const albums = store.albums.filter((item) => item.event_id === share.event_id);

  return { share, event, album, albums };
}

export async function listDevShareAlbums() {
  const store = await readStore();

  return store.shares
    .filter((share) => share.state === "active")
    .map((share) => ({
      share,
      event: store.events.find((event) => event.id === share.event_id) ?? null,
      album: store.albums.find((album) => album.id === share.album_id) ?? null
    }))
    .filter((item) => item.event && item.album);
}

async function ensureDevAlbumGuest(store: DevStore, albumId: string, sessionKeyHash: string) {
  const album = store.albums.find((item) => item.id === albumId);

  if (!album) {
    return null;
  }

  let nickname = store.nicknames.find(
    (item) => item.album_id === albumId && item.session_key_hash === sessionKeyHash
  );

  if (!nickname) {
    const eventNickname = store.nicknames.find(
      (item) => item.event_id === album.event_id && item.session_key_hash === sessionKeyHash
    );
    nickname = {
      id: randomUUID(),
      event_id: album.event_id,
      album_id: albumId,
      display_name:
        eventNickname?.display_name ??
        buildNickname(store.nicknames.filter((item) => item.album_id === albumId).length),
      session_key_hash: sessionKeyHash
    };
    store.nicknames.push(nickname);
  }

  let participant = store.participants.find(
    (item) => item.album_id === albumId && item.nickname_id === nickname.id
  );

  if (!participant) {
    participant = {
      id: randomUUID(),
      event_id: album.event_id,
      album_id: albumId,
      nickname_id: nickname.id
    };
    store.participants.push(participant);
  }

  return { album, nickname, participant };
}

export async function joinDevShare(slug: string, sessionKeyHash: string) {
  const store = await readStore();
  const share = store.shares.find((item) => item.slug === slug && item.state === "active");

  if (!share) {
    return null;
  }

  const guest = await ensureDevAlbumGuest(store, share.album_id, sessionKeyHash);

  if (!guest) {
    return null;
  }

  await writeStore(store);

  return {
    eventId: guest.album.event_id,
    albumId: share.album_id,
    participantId: guest.participant.id,
    nickname: guest.nickname.display_name
  };
}

export async function getDevJoinedGuest(slug: string, sessionKeyHash: string, albumId?: string) {
  const store = await readStore();
  const share = store.shares.find((item) => item.slug === slug && item.state === "active");

  if (!share) {
    return null;
  }

  const targetAlbumId = albumId ?? share.album_id;
  const nickname = store.nicknames.find(
    (item) => item.album_id === targetAlbumId && item.session_key_hash === sessionKeyHash
  );

  if (!nickname) {
    return null;
  }

  const participant = store.participants.find(
    (item) => item.album_id === targetAlbumId && item.nickname_id === nickname.id
  );

  return {
    participantId: participant?.id ?? null,
    nickname: nickname.display_name
  };
}

export async function createDevUploadIntent({
  albumId,
  filename,
  mediaType
}: {
  albumId: string;
  filename: string;
  mediaType: "image" | "video";
}) {
  const uploadId = randomUUID();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);

  return {
    uploadId,
    objectKey: `dev/albums/${albumId}/${mediaType}/${uploadId}-${safeName}`,
    uploadUrl: `dev://upload/${uploadId}`
  };
}

export async function confirmDevMediaUpload({
  albumId,
  objectKey,
  mediaType,
  filename,
  previewDataUrl,
  sessionKeyHash
}: {
  albumId: string;
  objectKey: string;
  mediaType: "image" | "video";
  filename: string;
  previewDataUrl?: string | null;
  sessionKeyHash: string;
}) {
  const store = await readStore();
  const guest = await ensureDevAlbumGuest(store, albumId, sessionKeyHash);

  if (!guest) {
    return null;
  }

  const media: DevMediaItem = {
    id: randomUUID(),
    album_id: albumId,
    event_id: guest.album.event_id,
    uploader_participant_id: guest.participant.id,
    nickname: guest.nickname.display_name,
    media_type: mediaType,
    original_object_key: objectKey,
    original_filename: filename,
    preview_data_url: previewDataUrl ?? null,
    upload_status: "uploaded",
    uploaded_at: new Date().toISOString()
  };

  store.media.push(media);
  await writeStore(store);

  return media;
}

export async function listDevAlbumMedia(albumId: string) {
  const store = await readStore();

  return store.media
    .filter((item) => item.album_id === albumId)
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
}

export async function setDevAlbumCover(albumId: string, mediaId: string) {
  const store = await readStore();
  const album = store.albums.find((item) => item.id === albumId);
  const media = store.media.find((item) => item.id === mediaId && item.album_id === albumId);

  if (!album || !media) {
    return null;
  }

  album.cover_media_id = mediaId;
  await writeStore(store);

  return album;
}

export async function relocateDevMedia(
  mediaId: string,
  targetAlbumId: string,
  mode: "move" | "copy"
) {
  const store = await readStore();
  const media = store.media.find((item) => item.id === mediaId);
  const targetAlbum = store.albums.find((item) => item.id === targetAlbumId);

  if (!media || !targetAlbum || media.event_id !== targetAlbum.event_id) {
    return null;
  }

  if (mode === "copy") {
    const copiedMedia: DevMediaItem = {
      ...media,
      id: randomUUID(),
      album_id: targetAlbumId,
      uploaded_at: new Date().toISOString()
    };

    store.media.push(copiedMedia);
    await writeStore(store);

    return copiedMedia;
  }

  const previousAlbumId = media.album_id;
  media.album_id = targetAlbumId;

  for (const album of store.albums) {
    if (album.cover_media_id === mediaId && album.id === previousAlbumId) {
      album.cover_media_id = null;
    }
  }

  await writeStore(store);

  return media;
}

export function toDevShareResponse(share: DevShareAccess) {
  const link = createShareLink(share.slug);

  return {
    id: share.id,
    slug: share.slug,
    link,
    state: share.state,
    permissions: share.permissions
  };
}
