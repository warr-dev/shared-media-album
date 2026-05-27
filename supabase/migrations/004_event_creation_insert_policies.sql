create policy "authenticated organizers create own participant row"
  on participants for insert
  with check (
    auth_user_id = auth.uid()
    and role = 'organizer'
    and access_state = 'active'
    and is_event_manager(event_id)
  );

create policy "event managers create activity"
  on album_activity for insert
  with check (is_event_manager(event_id));
