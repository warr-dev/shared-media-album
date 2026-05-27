create extension if not exists "pgcrypto";

create type event_type as enum (
  'wedding',
  'birthday',
  'conference',
  'concert',
  'reunion',
  'party',
  'custom'
);

create type album_visibility_state as enum ('active', 'hidden', 'expired');
create type album_moderation_state as enum ('open', 'review_required', 'locked');
create type share_access_state as enum ('active', 'disabled', 'expired');
create type participant_role as enum ('organizer', 'guest', 'reviewer');
create type participant_access_state as enum ('active', 'revoked');
create type nickname_state as enum ('active', 'retired');
create type media_type as enum ('image', 'video');
create type upload_status as enum ('pending', 'uploaded', 'failed', 'deleted');
create type media_moderation_state as enum ('visible', 'pending_review', 'hidden', 'removed');
create type metadata_visibility as enum ('private', 'shared');
create type tag_type as enum ('text', 'person');
create type tag_state as enum ('active', 'removed');
create type album_activity_type as enum (
  'event_created',
  'share_created',
  'nickname_assigned',
  'media_uploaded',
  'upload_failed',
  'tag_added',
  'tag_removed',
  'media_removed',
  'permissions_changed'
);

create table events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 140),
  event_type event_type not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  description text,
  location text,
  cover_media_id uuid,
  visibility_starts_at timestamptz,
  visibility_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table event_albums (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references events(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  visibility_state album_visibility_state not null default 'active',
  moderation_state album_moderation_state not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table share_access (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  album_id uuid not null references event_albums(id) on delete cascade,
  slug text not null unique,
  state share_access_state not null default 'active',
  permissions text[] not null default array['view', 'upload', 'tag'],
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  disabled_at timestamptz,
  expires_at timestamptz,
  check (permissions <@ array['view', 'upload', 'tag'])
);

create table client_nicknames (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  album_id uuid not null references event_albums(id) on delete cascade,
  display_name text not null,
  state nickname_state not null default 'active',
  session_key_hash text,
  created_at timestamptz not null default now(),
  retired_at timestamptz
);

create unique index client_nicknames_active_name_unique
  on client_nicknames(album_id, lower(display_name))
  where state = 'active';

create unique index client_nicknames_session_unique
  on client_nicknames(album_id, session_key_hash)
  where session_key_hash is not null and state = 'active';

create table participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  album_id uuid not null references event_albums(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  role participant_role not null,
  access_state participant_access_state not null default 'active',
  client_nickname_id uuid references client_nicknames(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index participants_active_user_unique
  on participants(album_id, auth_user_id)
  where auth_user_id is not null and access_state = 'active';

create unique index participants_active_nickname_unique
  on participants(album_id, client_nickname_id)
  where client_nickname_id is not null and access_state = 'active';

create table media_items (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references event_albums(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  uploader_participant_id uuid not null references participants(id) on delete restrict,
  nickname_id uuid references client_nicknames(id) on delete set null,
  media_type media_type not null,
  original_object_key text not null,
  upload_status upload_status not null default 'pending',
  moderation_state media_moderation_state not null default 'visible',
  metadata_visibility metadata_visibility not null default 'private',
  uploaded_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table events
  add constraint events_cover_media_fk
  foreign key (cover_media_id) references media_items(id) deferrable initially deferred;

create index media_items_album_uploaded_idx on media_items(album_id, uploaded_at desc);

create table tags (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references event_albums(id) on delete cascade,
  media_item_id uuid not null references media_items(id) on delete cascade,
  creator_participant_id uuid not null references participants(id) on delete restrict,
  tag_type tag_type not null,
  display_name text not null,
  normalized_value text not null,
  state tag_state not null default 'active',
  created_at timestamptz not null default now(),
  removed_at timestamptz
);

create unique index tags_active_media_value_unique
  on tags(media_item_id, tag_type, normalized_value)
  where state = 'active';

create table album_activity (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  album_id uuid not null references event_albums(id) on delete cascade,
  actor_participant_id uuid references participants(id) on delete set null,
  nickname_id uuid references client_nicknames(id) on delete set null,
  activity_type album_activity_type not null,
  subject_type text not null,
  subject_id uuid not null,
  created_at timestamptz not null default now()
);

create index album_activity_album_created_idx on album_activity(album_id, created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on events
  for each row execute function set_updated_at();

create trigger event_albums_updated_at
  before update on event_albums
  for each row execute function set_updated_at();
