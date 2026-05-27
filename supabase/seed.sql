insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'organizer@example.test',
  crypt('password', gen_salt('bf')),
  now(),
  now(),
  now()
)
on conflict (id) do nothing;
