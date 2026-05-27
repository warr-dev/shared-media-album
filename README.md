# Shared Media Album

Private event albums where an event manager creates an event, shares a QR/link,
and participants upload photos or videos into the right album using an assigned
guest identity.

## Features

- Supabase Auth for event manager accounts
- Event creation with shareable QR/link
- Multiple albums per event
- Participant upload from event QR/link
- Same participant nickname across albums in one event
- Album-style navigation with cover thumbnails
- Media preview with previous/next navigation
- Manager actions for tagging, setting album cover, moving, and copying media
- Local development fallback for uploads when Cloudflare R2 is not configured

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth/Postgres/RLS
- Cloudflare R2 optional for object storage
- Vitest and Playwright

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Minimum local Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-local-secret-key
APP_PUBLIC_URL=http://localhost:3000
```

Cloudflare values can stay empty for local development. Uploads will use local
preview data when R2 is not configured.

## Local Supabase

Start Supabase:

```bash
npx supabase start
```

Apply migrations:

```bash
npx supabase db reset --linked=false
```

Useful local URLs:

- Studio: `http://127.0.0.1:54323`
- Mailpit: `http://127.0.0.1:54324`
- API: `http://127.0.0.1:54321`

## Create Manager Account

Create a confirmed password account:

```bash
npm run account:create -- --email organizer@example.com --password "change-me"
```

Then sign in at:

```text
http://localhost:3000/login
```

## Run App

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Main Flow

1. Sign in as an event manager.
2. Create an event.
3. Add albums for the event.
4. Use the event QR/share link.
5. Participants open the event link, choose an album, and upload media.
6. Managers can set covers, tag media, move media, or copy media to another album.

## Checks

```bash
npx tsc --noEmit
npm run lint
npm test
```

End-to-end tests:

```bash
npm run test:e2e
```

## Notes

- The event share link is event-level; participants can choose any active album
  under the event.
- Album covers use `event_albums.cover_media_id`.
- Multiple albums require migration `006_multiple_event_albums.sql`.
- Album covers require migration `007_album_cover_media.sql`.
