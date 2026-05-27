alter table event_albums
  add column if not exists cover_media_id uuid references media_items(id) on delete set null;