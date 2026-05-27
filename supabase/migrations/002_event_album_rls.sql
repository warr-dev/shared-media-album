alter table events enable row level security;
alter table event_albums enable row level security;
alter table share_access enable row level security;
alter table client_nicknames enable row level security;
alter table participants enable row level security;
alter table media_items enable row level security;
alter table tags enable row level security;
alter table album_activity enable row level security;

create policy "organizers manage own events"
  on events for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "organizers view own albums"
  on event_albums for select
  using (exists (
    select 1 from events
    where events.id = event_albums.event_id
      and events.owner_id = auth.uid()
  ));

create policy "organizers manage own albums"
  on event_albums for all
  using (exists (
    select 1 from events
    where events.id = event_albums.event_id
      and events.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from events
    where events.id = event_albums.event_id
      and events.owner_id = auth.uid()
  ));

create policy "organizers manage share access"
  on share_access for all
  using (created_by = auth.uid() or exists (
    select 1 from events
    where events.id = share_access.event_id
      and events.owner_id = auth.uid()
  ))
  with check (created_by = auth.uid());

create policy "active share access is joinable"
  on share_access for select
  using (
    state = 'active'
    and (expires_at is null or expires_at > now())
    and 'view' = any(permissions)
  );

create policy "organizers view participants"
  on participants for select
  using (exists (
    select 1 from events
    where events.id = participants.event_id
      and events.owner_id = auth.uid()
  ));

create policy "participants view own row"
  on participants for select
  using (auth_user_id = auth.uid());

create policy "organizers revoke participants"
  on participants for update
  using (exists (
    select 1 from events
    where events.id = participants.event_id
      and events.owner_id = auth.uid()
  ));

create policy "organizers view nicknames"
  on client_nicknames for select
  using (exists (
    select 1 from events
    where events.id = client_nicknames.event_id
      and events.owner_id = auth.uid()
  ));

create policy "participants view visible media"
  on media_items for select
  using (
    upload_status = 'uploaded'
    and moderation_state = 'visible'
    and exists (
      select 1 from participants
      where participants.album_id = media_items.album_id
        and participants.auth_user_id = auth.uid()
        and participants.access_state = 'active'
    )
  );

create policy "organizers manage media"
  on media_items for all
  using (exists (
    select 1 from events
    where events.id = media_items.event_id
      and events.owner_id = auth.uid()
  ));

create policy "participants view active tags"
  on tags for select
  using (
    state = 'active'
    and exists (
      select 1 from participants
      where participants.album_id = tags.album_id
        and participants.auth_user_id = auth.uid()
        and participants.access_state = 'active'
    )
  );

create policy "organizers manage tags"
  on tags for all
  using (exists (
    select 1 from event_albums
    join events on events.id = event_albums.event_id
    where event_albums.id = tags.album_id
      and events.owner_id = auth.uid()
  ));

create policy "organizers view activity"
  on album_activity for select
  using (exists (
    select 1 from events
    where events.id = album_activity.event_id
      and events.owner_id = auth.uid()
  ));
