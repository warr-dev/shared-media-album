import { notFound } from "next/navigation";
import Link from "next/link";

import { GuestEventUploadView } from "@/components/guest-event-upload-view";
import { GuestAlbumView } from "@/components/guest-album-view";
import type { MediaGridItem } from "@/components/media-grid";
import { getGuestSessionKey, hashGuestSessionKey } from "@/lib/auth/guest-session";
import { hasSupabaseEnv } from "@/lib/config/env";
import { createSupabaseAdminClient } from "@/lib/db/supabase-server";
import { listAlbumMedia } from "@/lib/db/queries/media";
import { getDevJoinedGuest, getDevShareLanding, listDevAlbumMedia } from "@/lib/dev/event-store";

type GuestAlbumSection = {
  album: {
    id: string;
    title: string;
  };
  items: MediaGridItem[];
};

function GuestShareIntro({
  shareSlug,
  eventName,
  eventType,
  albumCount
}: {
  shareSlug: string;
  eventName?: string | null;
  eventType?: string | null;
  albumCount: number;
}) {
  const isWedding = eventType === "wedding";

  return (
    <section className="guest-screen mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#f8f8f3] text-[#034326] shadow-sm">
      <div className="relative min-h-[38vh] overflow-hidden">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#8fb9a6]" />
        <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#c8ddd2]" />
        <div className="absolute left-24 top-8 h-52 w-52 rounded-full bg-[#67947e]" />
        <div className="absolute right-10 top-28 h-28 w-28 rounded-full bg-[#dfece5]" />
        <div className="absolute left-6 top-32 h-24 w-24 rounded-full bg-white" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f8f8f3] to-transparent" />
      </div>

      <div className="guest-stagger flex flex-1 flex-col px-8 pb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-[#2f6b4f]/75">
          {eventName ?? "Shared wedding album"}
        </p>
        <h1 className="mt-5 text-4xl font-bold leading-tight">
          {isWedding ? "We're officially Mr. & Mrs" : "Share your favorite moments"}
        </h1>
        <div className="mt-6 grid gap-4 text-lg leading-7">
          <p>
            As much as we would love to personally hug, chat, and take photos
            with each and every one of you, the celebration chaos is real.
          </p>
          <p>
            If we did not get a snap together, we would absolutely love to see
            your fun moments from our big day.
          </p>
        </div>

        <div className="mx-auto mt-10 w-56">
          <div className="relative mx-auto h-28 w-44 rounded-lg bg-[#a9cfbd] shadow-xl">
            <div className="absolute left-8 top-4 h-16 w-16 rounded-full border-[10px] border-[#4f5554] bg-[#d7dfdc]" />
            <div className="absolute left-12 top-8 h-8 w-8 rounded-full bg-[#8c9692]" />
            <div className="absolute right-5 top-7 h-8 w-10 rounded-sm bg-[#353838]" />
            <div className="absolute -top-3 left-20 h-8 w-16 -rotate-6 rounded-sm bg-[#d8d8d8]" />
          </div>
        </div>

        <p className="mt-auto pt-12 text-xl font-bold leading-7">
          Got a photo from the wedding? Any picture will do, even the bloopers,
          selfies, or your plate of food.
        </p>
        <Link
          className="guest-pressable mt-7 inline-flex h-16 items-center justify-center rounded-lg border-2 border-[#2f6b4f] bg-[#a9cfbd] px-6 text-2xl font-medium uppercase tracking-wide text-[#034326] hover:bg-[#98c3ae] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034326] focus-visible:ring-offset-2"
          href={`/a/${shareSlug}?view=upload`}
        >
          Upload here
        </Link>
        {albumCount > 1 ? (
          <p className="mt-3 text-sm text-[#2f6b4f]/75">
            Choose from {albumCount} albums after opening the gallery.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function GuestUploadScreen({
  shareSlug,
  canUpload,
  albumSections
}: {
  shareSlug: string;
  canUpload: boolean;
  albumSections: GuestAlbumSection[];
}) {
  return (
    <GuestEventUploadView
      albumSections={albumSections}
      canUpload={canUpload}
      shareSlug={shareSlug}
    />
  );
}

function GuestPhotosScreen({
  shareSlug,
  albumSections,
  selectedAlbumId
}: {
  shareSlug: string;
  albumSections: GuestAlbumSection[];
  selectedAlbumId?: string | null;
}) {
  return (
    <section className="guest-screen mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-[#f7faf8] text-[#034326] shadow-sm">
      <div className="relative overflow-hidden bg-[#d8ece1] px-6 pb-8 pt-7">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute -left-24 top-7 h-44 w-72 rotate-[-18deg] rounded-full border border-[#8fb9a6]" />
          <div className="absolute right-[-80px] top-0 h-52 w-52 rounded-full bg-[#c8ddd2]" />
          <div className="absolute left-10 top-8 h-3 w-3 rounded-full bg-white" />
          <div className="absolute right-20 top-16 h-2 w-2 rounded-full bg-[#7da08e]" />
          <div className="absolute right-8 top-28 h-3 w-3 rounded-full bg-white" />
        </div>
        <div className="relative mx-auto grid h-32 w-32 place-items-center rounded-full bg-white text-[#a86618] shadow-sm">
          <span className="font-serif text-5xl leading-none">R</span>
          <span className="absolute text-4xl italic">&amp;</span>
          <span className="absolute bottom-6 right-7 font-serif text-5xl leading-none">M</span>
        </div>
      </div>

      <div className="guest-panel-rise -mt-6 rounded-t-[22px] bg-[#f7faf8] px-4 pb-6 pt-6">
        <div className="guest-fade-up grid h-14 grid-cols-2 rounded-xl bg-[#d9d9d9] p-0.5 text-[18px] shadow-inner">
          <Link
            className="guest-pressable grid place-items-center rounded-xl text-[#777] hover:text-[#034326]"
            href={`/a/${shareSlug}?view=upload`}
          >
            Upload Photo
          </Link>
          <span className="grid place-items-center rounded-xl bg-[#a9cfbd] font-semibold text-[#034326] shadow-md">
            Photos
          </span>
        </div>

        <div className="guest-fade-up mt-6">
          <GuestAlbumView albumSections={albumSections} initialAlbumId={selectedAlbumId} />
        </div>
      </div>
    </section>
  );
}

export default async function ShareLandingPage({
  params,
  searchParams
}: {
  params: Promise<{ shareSlug: string }>;
  searchParams?: Promise<{ albumId?: string; joined?: string; error?: string; view?: string }>;
}) {
  const { shareSlug } = await params;
  const query = searchParams ? await searchParams : {};
  const showAlbum = query.view === "album";
  const showUpload = query.view === "upload";

  if (!hasSupabaseEnv()) {
    const detail = await getDevShareLanding(shareSlug);

    if (!detail) {
      notFound();
    }

    const albums = detail.albums.length ? detail.albums : detail.album ? [detail.album] : [];

    if (!showAlbum && !showUpload) {
      return (
        <GuestShareIntro
          albumCount={albums.length}
          eventName={detail.event?.name}
          eventType={detail.event?.event_type}
          shareSlug={shareSlug}
        />
      );
    }

    if (showUpload) {
      const uploadSessionKey = await getGuestSessionKey();
      const uploadSessionKeyHash = uploadSessionKey ? hashGuestSessionKey(uploadSessionKey) : null;
      const uploadAlbumSections = await Promise.all(
        albums.map(async (album) => ({
          album,
          joinedGuest: uploadSessionKeyHash
            ? await getDevJoinedGuest(shareSlug, uploadSessionKeyHash, album.id)
            : null,
          mediaItems: await listDevAlbumMedia(album.id)
        }))
      );

      return (
        <GuestUploadScreen
          albumSections={uploadAlbumSections.map(({ album, joinedGuest, mediaItems }) => ({
            album: {
              id: album.id,
              title: album.title
            },
            items: mediaItems.map((item) => ({
              id: item.id,
              album_id: item.album_id,
              media_type: item.media_type,
              original_filename: item.original_filename,
              preview_data_url: item.preview_data_url,
              nickname: item.nickname,
              uploaded_at: item.uploaded_at,
              can_tag: false,
              can_remove: joinedGuest ? item.uploader_participant_id === joinedGuest.participantId : false,
              can_set_cover: false
            }))
          }))}
          canUpload={detail.share.permissions.includes("upload")}
          shareSlug={shareSlug}
        />
      );
    }

    const sessionKey = await getGuestSessionKey();
    const sessionKeyHash = sessionKey ? hashGuestSessionKey(sessionKey) : null;
    const albumSections = await Promise.all(
      albums.map(async (album) => ({
        album,
        joinedGuest: sessionKeyHash ? await getDevJoinedGuest(shareSlug, sessionKeyHash, album.id) : null,
        mediaItems: await listDevAlbumMedia(album.id)
      }))
    );

    return (
      <GuestPhotosScreen
        albumSections={albumSections.map(({ album, joinedGuest, mediaItems }) => ({
          album: {
            id: album.id,
            title: album.title
          },
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
        selectedAlbumId={query.albumId}
        shareSlug={shareSlug}
      />
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

  if (!showAlbum && !showUpload) {
    return (
      <GuestShareIntro
        albumCount={albums?.length ?? 0}
        eventName={event?.name}
        eventType={event?.event_type}
        shareSlug={shareSlug}
      />
    );
  }

  if (showUpload) {
    const uploadSessionKey = await getGuestSessionKey();
    const uploadSessionKeyHash = uploadSessionKey ? hashGuestSessionKey(uploadSessionKey) : null;
    const uploadAlbumSections = await Promise.all(
      (albums ?? []).map(async (album) => {
        const { data: nickname } = uploadSessionKeyHash
          ? await supabase
              .from("client_nicknames")
              .select()
              .eq("album_id", album.id)
              .eq("session_key_hash", uploadSessionKeyHash)
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
          participant,
          mediaItems: await listAlbumMedia(supabase, album.id)
        };
      })
    );

    return (
      <GuestUploadScreen
        albumSections={uploadAlbumSections.map(({ album, participant, mediaItems }) => ({
          album: {
            id: album.id,
            title: album.title
          },
          items: mediaItems.map((item) => ({
            id: item.id,
            album_id: item.album_id,
            media_type: item.media_type,
            original_filename: item.original_filename ?? undefined,
            preview_data_url: item.preview_data_url,
            nickname: item.client_nicknames?.display_name,
            uploaded_at: item.uploaded_at,
            can_tag: false,
            can_remove: participant ? item.uploader_participant_id === participant.id : false,
            can_set_cover: false
          }))
        }))}
        canUpload={share.permissions.includes("upload")}
        shareSlug={shareSlug}
      />
    );
  }

  const sessionKey = await getGuestSessionKey();
  const sessionKeyHash = sessionKey ? hashGuestSessionKey(sessionKey) : null;
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
  const canTag = share.permissions.includes("tag");

  return (
    <GuestPhotosScreen
      albumSections={albumSections.map(({ album, participant, mediaItems }) => ({
        album: {
          id: album.id,
          title: album.title
        },
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
      selectedAlbumId={query.albumId}
      shareSlug={shareSlug}
    />
  );
}
