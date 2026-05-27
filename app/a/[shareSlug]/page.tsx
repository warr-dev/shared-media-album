import { notFound } from "next/navigation";

import { AlbumGalleryList } from "@/components/album-gallery-list";
import { getGuestSessionKey, hashGuestSessionKey } from "@/lib/auth/guest-session";
import { hasSupabaseEnv } from "@/lib/config/env";
import { createSupabaseAdminClient } from "@/lib/db/supabase-server";
import { listAlbumMedia } from "@/lib/db/queries/media";
import { getDevJoinedGuest, getDevShareLanding, joinDevShare, listDevAlbumMedia } from "@/lib/dev/event-store";
import { createGuestParticipant } from "@/lib/db/queries/participants";
import { assignNicknameForAlbum } from "@/lib/nicknames/assign";

export default async function ShareLandingPage({
  params,
  searchParams
}: {
  params: Promise<{ shareSlug: string }>;
  searchParams?: Promise<{ joined?: string; error?: string }>;
}) {
  const { shareSlug } = await params;
  const query = searchParams ? await searchParams : {};

  if (!hasSupabaseEnv()) {
    const detail = await getDevShareLanding(shareSlug);

    if (!detail) {
      notFound();
    }

    const albums = detail.albums.length ? detail.albums : detail.album ? [detail.album] : [];
    const sessionKey = await getGuestSessionKey();
    const sessionKeyHash = sessionKey ? hashGuestSessionKey(sessionKey) : null;
    const devIdentity =
      sessionKeyHash && detail.album ? await joinDevShare(shareSlug, sessionKeyHash) : null;
    const albumSections = await Promise.all(
      albums.map(async (album) => ({
        album,
        joinedGuest: sessionKeyHash ? await getDevJoinedGuest(shareSlug, sessionKeyHash, album.id) : null,
        mediaItems: await listDevAlbumMedia(album.id)
      }))
    );

    return (
      <section className="grid gap-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {detail.event?.event_type}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{detail.event?.name}</h1>
            <p className="mt-2 text-muted-foreground">
              Choose the album where each photo or video belongs.
            </p>
          </div>
          {devIdentity ? (
            <div className="rounded-md border border-border bg-card px-3 py-2 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Identity</p>
              <p className="font-medium">{devIdentity.nickname}</p>
            </div>
          ) : null}
        </div>
        <AlbumGalleryList
          albums={albumSections.map(({ album, joinedGuest, mediaItems }) => ({
            id: album.id,
            title: album.title,
            eyebrow: "Album",
            meta: `${mediaItems.length} uploads`,
            coverMediaId: album.cover_media_id,
            uploadAlbumId: album.id,
            items: mediaItems.map((item) => ({
                  id: item.id,
                  album_id: item.album_id,
                  media_type: item.media_type,
                  original_filename: item.original_filename,
                  preview_data_url: item.preview_data_url,
                  nickname: item.nickname,
                  uploaded_at: item.uploaded_at,
                  can_tag: joinedGuest ? item.uploader_participant_id === joinedGuest.participantId : false,
                  can_remove: joinedGuest ? item.uploader_participant_id === joinedGuest.participantId : false,
                  can_set_cover: false
                }))
          }))}
        />
      </section>
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: share } = await supabase
    .from("share_access")
    .select()
    .eq("slug", shareSlug)
    .eq("state", "active")
    .single();

  if (!share) {
    notFound();
  }

  const [{ data: event }, { data: albums }] = await Promise.all([
    supabase.from("events").select().eq("id", share.event_id).single(),
    supabase
      .from("event_albums")
      .select()
      .eq("event_id", share.event_id)
      .eq("visibility_state", "active")
      .order("created_at", { ascending: true })
  ]);
  const sessionKey = await getGuestSessionKey();
  const sessionKeyHash = sessionKey ? hashGuestSessionKey(sessionKey) : null;
  const identityAlbum = albums?.[0] ?? null;
  const identityNickname =
    sessionKeyHash && identityAlbum
      ? await assignNicknameForAlbum(supabase, {
          eventId: share.event_id,
          albumId: identityAlbum.id,
          sessionKeyHash
        })
      : null;
  const identityParticipant =
    identityNickname && identityAlbum
      ? await createGuestParticipant(supabase, {
          eventId: share.event_id,
          albumId: identityAlbum.id,
          nicknameId: identityNickname.id
        })
      : null;
  const albumSections = await Promise.all(
    (albums ?? []).map(async (album) => {
      const { data: nickname } = sessionKeyHash
        ? await supabase
            .from("client_nicknames")
            .select()
            .eq("album_id", album.id)
            .eq("session_key_hash", sessionKeyHash)
            .eq("state", "active")
            .maybeSingle()
        : { data: null };
      const { data: participant } = nickname
        ? await supabase
            .from("participants")
            .select()
            .eq("album_id", album.id)
            .eq("client_nickname_id", nickname.id)
            .eq("access_state", "active")
            .maybeSingle()
        : { data: null };

      return {
        album,
        nickname,
        participant,
        mediaItems: await listAlbumMedia(supabase, album.id)
      };
    })
  );
  const canUpload = share.permissions.includes("upload");
  const canTag = share.permissions.includes("tag");

  return (
    <section className="grid gap-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {event?.event_type}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{event?.name}</h1>
          <p className="mt-2 text-muted-foreground">
            Choose the album where each photo or video belongs.
          </p>
        </div>
        {identityNickname && identityParticipant ? (
          <div className="rounded-md border border-border bg-card px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Identity</p>
            <p className="font-medium">{identityNickname.display_name}</p>
          </div>
        ) : null}
      </div>
      {query.error === "join-not-configured" ? (
        <p className="rounded-md border border-destructive bg-card p-3 text-sm text-destructive">
          Guest joining needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
        </p>
      ) : null}
      <AlbumGalleryList
        albums={albumSections.map(({ album, participant, mediaItems }) => ({
          id: album.id,
          title: album.title,
          eyebrow: "Album",
          meta: `${mediaItems.length} uploads`,
          coverMediaId: album.cover_media_id,
          uploadAlbumId: canUpload ? album.id : undefined,
          items: mediaItems.map((item) => ({
                id: item.id,
                album_id: item.album_id,
                media_type: item.media_type,
                original_filename: item.original_filename ?? undefined,
                preview_data_url: item.preview_data_url,
                nickname: item.client_nicknames?.display_name,
                uploaded_at: item.uploaded_at,
                can_tag: canTag && participant ? item.uploader_participant_id === participant.id : false,
                can_remove: participant ? item.uploader_participant_id === participant.id : false,
                can_set_cover: false
              }))
        }))}
      />
    </section>
  );
}
