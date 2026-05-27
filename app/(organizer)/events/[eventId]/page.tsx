import { notFound } from "next/navigation";

import { AlbumForm } from "@/components/album-form";
import { AlbumGalleryList } from "@/components/album-gallery-list";
import { QrSharePanel } from "@/components/qr-share-panel";
import { getEventManagerStatus } from "@/lib/auth/event-manager";
import { hasSupabasePublicEnv } from "@/lib/config/env";
import { listAlbumMedia } from "@/lib/db/queries/media";
import { createShareLink } from "@/lib/db/queries/share-access";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getDevEventDetail, listDevAlbumMedia } from "@/lib/dev/event-store";

export default async function EventDetailPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  if (!hasSupabasePublicEnv()) {
    const detail = await getDevEventDetail(eventId);

    if (!detail) {
      notFound();
    }

    const albumSections = detail.albums.length ? detail.albums : detail.album ? [detail.album] : [];
    const mediaByAlbum = await Promise.all(
      albumSections.map(async (album) => ({
        album,
        mediaItems: await listDevAlbumMedia(album.id)
      }))
    );
    const albumOptions = albumSections.map((album) => ({
      id: album.id,
      title: album.title
    }));

    return (
      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 sm:px-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {detail.event.event_type}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{detail.event.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {new Date(detail.event.starts_at).toLocaleString()}
          </p>
          {detail.album ? (
            <p className="mt-1 text-sm text-muted-foreground">{detail.album.title}</p>
          ) : null}
          <p className="mt-3 inline-flex rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
            Manager access
          </p>
        </div>
        <AlbumForm eventId={detail.event.id} />
        {detail.share ? (
          <QrSharePanel
            eventId={detail.event.id}
            link={createShareLink(detail.share.slug)}
            permissions={detail.share.permissions}
          />
        ) : null}
        <AlbumGalleryList
          albums={mediaByAlbum.map(({ album, mediaItems }) => ({
            id: album.id,
            title: album.title,
            eyebrow: "Managed album",
            meta: `${mediaItems.length} uploads`,
            coverMediaId: album.cover_media_id,
            albumOptions,
            items: mediaItems.map((item) => ({
                  id: item.id,
                  album_id: item.album_id,
                  media_type: item.media_type,
                  original_filename: item.original_filename,
                  preview_data_url: item.preview_data_url,
                  nickname: item.nickname,
                  uploaded_at: item.uploaded_at,
                  can_tag: true,
                  can_remove: true,
                  can_set_cover: true
                }))
          }))}
        />
      </section>
    );
  }

  const supabase = await createSupabaseServerClient();
  const managerStatus = await getEventManagerStatus(supabase, eventId);
  const { data: event } = await supabase
    .from("events")
    .select()
    .eq("id", eventId)
    .single();

  if (!event) {
    notFound();
  }

  const { data: share } = await supabase
    .from("share_access")
    .select()
    .eq("event_id", event.id)
    .eq("state", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: albums } = await supabase
    .from("event_albums")
    .select()
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });
  const mediaByAlbum = await Promise.all(
    (albums ?? []).map(async (album) => ({
      album,
      mediaItems: await listAlbumMedia(supabase, album.id)
    }))
  );
  const albumOptions = (albums ?? []).map((album) => ({
    id: album.id,
    title: album.title
  }));

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 sm:px-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{event.event_type}</p>
        <h1 className="mt-2 text-3xl font-semibold">{event.name}</h1>
        <p className="mt-2 text-muted-foreground">{new Date(event.starts_at).toLocaleString()}</p>
        <p
          className={
            managerStatus.isManager
              ? "mt-3 inline-flex rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
              : "mt-3 inline-flex rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
          }
        >
          {managerStatus.isManager ? `Manager access: ${managerStatus.role}` : "View only"}
        </p>
      </div>
      {managerStatus.isManager ? <AlbumForm eventId={event.id} /> : null}
      {managerStatus.isManager && share ? (
        <QrSharePanel eventId={event.id} link={createShareLink(share.slug)} permissions={share.permissions} />
      ) : null}
      <AlbumGalleryList
        albums={mediaByAlbum.map(({ album, mediaItems }) => ({
          id: album.id,
          title: album.title,
          eyebrow: managerStatus.isManager ? "Managed album" : "Album",
          meta: `${mediaItems.length} uploads`,
          coverMediaId: album.cover_media_id,
          albumOptions: managerStatus.isManager ? albumOptions : [],
          items: mediaItems.map((item) => ({
                id: item.id,
                album_id: item.album_id,
                media_type: item.media_type,
                original_filename: item.original_filename ?? undefined,
                preview_data_url: item.preview_data_url,
                nickname: item.client_nicknames?.display_name,
                uploaded_at: item.uploaded_at,
                can_tag: managerStatus.isManager,
                can_remove: managerStatus.isManager,
                can_set_cover: managerStatus.isManager
              }))
        }))}
      />
    </section>
  );
}
