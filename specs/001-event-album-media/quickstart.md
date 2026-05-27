# Quickstart: Event Album Media Sharing

## Prerequisites

- Node.js 22 LTS
- pnpm
- Supabase project or local Supabase CLI environment
- Cloudflare account with R2 bucket and image delivery configured

## Environment

Create `.env.local` with:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_IMAGES_ACCOUNT_HASH=
APP_PUBLIC_URL=http://localhost:3000
```

## Install

```bash
pnpm install
```

## Database

```bash
pnpm supabase:start
pnpm db:migrate
pnpm db:seed
```

## Run

```bash
pnpm dev
```

## Validate P1 Event Creation

1. Open `http://localhost:3000/events/new`.
2. Create an event with name, type, date, owner session, and album title.
3. Confirm the event detail page shows the saved event details.
4. Confirm the QR code and share link are generated.
5. Open the share link in a private browser window.
6. Confirm event details display and a client nickname is assigned.

## Validate Upload and Tag Flow

1. From the share link, upload one image.
2. Confirm upload progress, success state, and album grid visibility.
3. Confirm the media item is attributed to the assigned nickname.
4. Add one text tag and one people tag.
5. Filter the album by each tag.
6. Remove a tag as its creator.

## Validation Commands

```bash
pnpm lint
pnpm test
pnpm test:e2e
```
