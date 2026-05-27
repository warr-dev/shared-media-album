import { AlbumGalleryList } from "@/components/album-gallery-list";
import { hasSupabaseEnv } from "@/lib/config/env";
import { listAlbumMedia } from "@/lib/db/queries/media";
import { createSupabaseAdminClient } from "@/lib/db/supabase-server";
import { listDevAlbumMedia, listDevShareAlbums } from "@/lib/dev/event-store";

export default async function AlbumPickerPage() {
  if (!hasSupabaseEnv()) {
    const albums = await listDevShareAlbums();

    return (
      <section className="grid gap-8 py-8">
        <div>
          <h1 className="text-3xl font-semibold">Event albums</h1>
          <p className="mt-2 text-muted-foreground">Choose the album where your photo or video belongs.</p>
        </div>
        <AlbumGalleryList
          albums={await Promise.all(
            albums.map(async ({ share, event, album }) => {
              const mediaItems = album ? await listDevAlbumMedia(album.id) : [];

              return {
                id: album?.id ?? share.id,
                title: album?.title ?? "Album",
                eyebrow: event?.event_type,
                meta: event?.name,
                coverMediaId: album?.cover_media_id,
                uploadAlbumId: album?.id,
                items: mediaItems.map((item) => ({
                    ...item,
                    album_id: item.album_id
                  }))
              };
            })
          )}
        />
      </section>
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: shares } = await supabase
    .from("share_access")
    .select()
    .eq("state", "active")
    .order("created_at", { ascending: false });

  const albums = await Promise.all(
    (shares ?? []).map(async (share) => {
      const [{ data: event }, { data: album }] = await Promise.all([
        supabase.from("events").select().eq("id", share.event_id).single(),
        supabase.from("event_albums").select().eq("id", share.album_id).single()
      ]);
      const mediaItems = album ? await listAlbumMedia(supabase, album.id) : [];

      return { share, event, album, mediaItems };
    })
  );

  return (
    <section className="grid gap-8 py-8">
      <div>
        <h1 className="text-3xl font-semibold">Event albums</h1>
        <p className="mt-2 text-muted-foreground">Choose the album where your photo or video belongs.</p>
      </div>
      <AlbumGalleryList
        albums={albums.map(({ share, event, album, mediaItems }) => ({
          id: album?.id ?? share.id,
          title: album?.title ?? "Album",
          eyebrow: event?.event_type,
          meta: event?.name,
          coverMediaId: album?.cover_media_id,
          uploadAlbumId: album?.id,
          items: mediaItems.map((item) => ({
                id: item.id,
                album_id: item.album_id,
                media_type: item.media_type,
                original_filename: item.original_filename ?? undefined,
                preview_data_url: item.preview_data_url,
                nickname: item.client_nicknames?.display_name,
                uploaded_at: item.uploaded_at
              }))
        }))}
      />
    </section>
  );
}
