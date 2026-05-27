create or replace function is_event_manager(check_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from events
    where events.id = check_event_id
      and events.owner_id = auth.uid()
  )
  or exists (
    select 1 from participants
    where participants.event_id = check_event_id
      and participants.auth_user_id = auth.uid()
      and participants.role in ('organizer', 'reviewer')
      and participants.access_state = 'active'
  );
$$;

create policy "event managers view events"
  on events for select
  using (is_event_manager(id));

create policy "event managers update events"
  on events for update
  using (is_event_manager(id))
  with check (is_event_manager(id));

create policy "event managers manage albums"
  on event_albums for all
  using (is_event_manager(event_id))
  with check (is_event_manager(event_id));

create policy "event managers manage share access"
  on share_access for all
  using (is_event_manager(event_id))
  with check (is_event_manager(event_id));

create policy "event managers view all participants"
  on participants for select
  using (is_event_manager(event_id));

create policy "event managers update participants"
  on participants for update
  using (is_event_manager(event_id))
  with check (is_event_manager(event_id));

create policy "event managers view nicknames"
  on client_nicknames for select
  using (is_event_manager(event_id));

create policy "event managers manage media"
  on media_items for all
  using (is_event_manager(event_id));

create policy "event managers manage tags"
  on tags for all
  using (exists (
    select 1 from event_albums
    where event_albums.id = tags.album_id
      and is_event_manager(event_albums.event_id)
  ));

create policy "event managers view activity"
  on album_activity for select
  using (is_event_manager(event_id));
