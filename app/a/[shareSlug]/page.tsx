import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { GuestEventUploadView } from "@/components/guest-event-upload-view";
import { GuestAlbumView } from "@/components/guest-album-view";
import { GuestMessageView } from "@/components/guest-message-view";
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
  albumSections,
  currentNickname
}: {
  shareSlug: string;
  canUpload: boolean;
  albumSections: GuestAlbumSection[];
  currentNickname?: string | null;
}) {
  return (
    <GuestEventUploadView
      albumSections={albumSections}
      canUpload={canUpload}
      shareSlug={shareSlug}
      currentNickname={currentNickname}
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
    <section className="guest-screen mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-white text-[#034326] shadow-sm flex flex-col">
      {/* Top Banner with Background Image */}
      <div
        className="relative flex min-h-[38svh] flex-col overflow-hidden bg-[#7f7b74] px-5 pb-6 pt-16 text-white shrink-0"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop')" 
          }}
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            className="guest-pressable inline-flex items-center gap-2 bg-black border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md"
            href={`/a/${shareSlug}?view=upload`}
          >
            <ChevronLeft className="h-4 w-4" />
            back
          </Link>
        </div>

        {/* Text Overlay */}
        <div className="guest-stagger relative mt-auto text-center z-10">
          <p className="mx-auto max-w-[21rem] px-2 text-[16px] font-bold leading-6 text-white drop-shadow-md">
            Got a photo from the wedding? Any picture will do even the
            bloopers, selfies, or your plate of food!
          </p>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="guest-panel-rise flex-1 -mt-5 rounded-t-[22px] bg-white px-4 pb-8 pt-6 z-20">
        <div className="guest-fade-up">
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
  const showMessage = query.view === "message";

  if (!hasSupabaseEnv()) {
    const detail = await getDevShareLanding(shareSlug);

    if (!detail) {
      notFound();
    }

    const albums = detail.albums.length ? detail.albums : detail.album ? [detail.album] : [];

    if (!showAlbum && !showUpload && !showMessage) {
      return (
        <GuestShareIntro
          albumCount={albums.length}
          eventName={detail.event?.name}
          eventType={detail.event?.event_type}
          shareSlug={shareSlug}
        />
      );
    }

    if (showMessage) {
      return (
        <GuestMessageView
          shareSlug={shareSlug}
          eventName={detail.event?.name}
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

      const currentNickname = uploadAlbumSections.find((s) => s.joinedGuest?.nickname)?.joinedGuest?.nickname ?? null;

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
          currentNickname={currentNickname}
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

  if (!showAlbum && !showUpload && !showMessage) {
    return (
      <GuestShareIntro
        albumCount={albums?.length ?? 0}
        eventName={event?.name}
        eventType={event?.event_type}
        shareSlug={shareSlug}
      />
    );
  }

  if (showMessage) {
    return (
      <GuestMessageView
        shareSlug={shareSlug}
        eventName={event?.name}
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
          nickname,
          mediaItems: await listAlbumMedia(supabase, album.id)
        };
      })
    );

    const currentNickname = uploadAlbumSections.find((s) => s.nickname?.display_name)?.nickname?.display_name ?? null;

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
        currentNickname={currentNickname}
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
