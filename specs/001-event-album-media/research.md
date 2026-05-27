# Research: Event Album Media Sharing

## Decision: Next.js Full-Stack Web App

**Rationale**: The product needs fast organizer forms, QR/link landing pages,
mobile-first guest uploads, and server-controlled write paths. Next.js App Router
supports a single deployable web app with server-rendered pages, route handlers,
and progressive client interactivity.

**Alternatives considered**:
- Separate frontend plus API service: more operational overhead for the MVP.
- Mobile apps first: QR/link guest participation should work without app install.

## Decision: Supabase Postgres, Auth, and RLS

**Rationale**: Events, albums, participants, nicknames, tags, and activity are
relational. Row Level Security maps well to private event albums and revocable
share access. Anonymous guest identity supports QR/link clients without forcing
account creation.

**Alternatives considered**:
- Firebase: good realtime primitives, but relational event/media/tag queries and
  access rules are clearer in Postgres for this scope.
- Custom auth and Postgres: more implementation risk for the MVP.

## Decision: Cloudflare R2 for Original Media

**Rationale**: Original photos/videos should live in object storage and be
uploaded through signed flows. R2 gives S3-compatible object storage and avoids
coupling large media files to the app runtime.

**Alternatives considered**:
- Supabase Storage only: simpler, but R2 is a stronger fit for media-heavy albums
  and external image/video delivery options.
- App-server uploads: rejected because large files should not pass through app
  memory for normal flows.

## Decision: Cloudflare Images or Image Resizing for Variants

**Rationale**: Album grids need thumbnails and optimized variants. Derived media
should be traceable and regenerable from originals, matching the constitution.

**Alternatives considered**:
- Generate all variants in the app: adds background job complexity early.
- Show originals directly: poor performance and higher bandwidth use.

## Decision: Auto-Assigned Guest Nicknames

**Rationale**: QR/link guests need attribution before uploads, tags, and activity
without forcing sign-up. Nicknames are scoped to an event album and should remain
stable for a returning client when reasonably possible.

**Alternatives considered**:
- User-entered names: friction at QR entry and name collisions.
- Fully anonymous activity: weaker moderation and less useful album context.

## Decision: Tags as Relational Rows

**Rationale**: Free-form tags and people tags need normalization, creator
ownership, edit permissions, and filtering. Relational tables keep tag queries
and permissions explicit.

**Alternatives considered**:
- Store tags as JSON on media: harder to enforce creator permissions and search.
- Dedicated search engine: unnecessary for MVP album scale.
