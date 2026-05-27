# Implementation Plan: Event Album Media Sharing

**Branch**: `001-event-album-media` | **Date**: 2026-05-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-event-album-media/spec.md`

## Summary

Build a web app where organizers create typed events with event details, receive
a QR/link-backed event album, and guests can join through that QR/link with an
auto-assigned nickname. Guests can upload photos/videos, add free-form and
people tags, and organizers can manage share access, participation, media, and
tags.

Technical approach: a Next.js TypeScript app with Supabase Postgres/Auth/RLS for
event, participant, nickname, tag, and activity data; Cloudflare R2 for original
media; Cloudflare Images or image resizing for thumbnails/variants; direct
client-to-storage uploads through signed upload flows controlled by server
actions/API routes.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22 LTS

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, shadcn/ui,
Supabase JS, Zod, TanStack Query where client-side cache is needed, QR code
generation library, Cloudflare R2 S3-compatible client

**Storage**: Supabase Postgres for relational data; Supabase Auth for organizer
and anonymous guest identity; Cloudflare R2 for original media; Cloudflare
Images or image resizing for thumbnails and optimized variants

**Testing**: Vitest for unit tests, Playwright for end-to-end user journeys,
Supabase local/test database migrations for integration tests, contract tests
against route handlers using generated OpenAPI examples

**Target Platform**: Responsive web app on modern mobile and desktop browsers

**Project Type**: Full-stack web application

**Performance Goals**: Event creation and QR/link generation complete in under
2 minutes for organizers; completed uploads appear to authorized viewers within
30 seconds under normal network conditions; tag filtering responds in under 10
seconds for expected album sizes

**Constraints**: Private-by-default albums; QR/link access must be revocable;
guest nickname assignment must happen before upload/tag/activity attribution;
media originals must remain in object storage and not pass through application
memory for normal uploads

**Scale/Scope**: MVP supports multiple organizers, multiple events, one primary
album per event, QR/link guests, photo/video uploads, text tags, people tags,
and organizer moderation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Privacy and Consent**: PASS. Event albums are private by default; access is
  mediated through revocable QR/link share access, Supabase RLS, and organizer
  controls.
- **Media Integrity and Ownership**: PASS. Originals are stored in R2, derived
  thumbnails/variants are traceable and regenerable, and deletion/moderation
  states are modeled explicitly.
- **Independent Journeys**: PASS. P1 event creation and QR/link generation is
  independently shippable before uploads, tags, and management features.
- **Testable Quality**: PASS. Plan requires unit, integration, contract, and
  Playwright coverage for access control, event creation, upload, nickname,
  tagging, and organizer moderation workflows.
- **Simplicity and Observability**: PASS. Architecture keeps a single Next.js app
  boundary, managed Postgres/Auth, object storage, and explicit album activity
  events without exposing private media content in logs.

## Project Structure

### Documentation (this feature)

```text
specs/001-event-album-media/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── diagrams/
│   └── feature-graph.md
├── contracts/
│   └── openapi.yaml
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
app/
├── (organizer)/
│   ├── events/
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   └── events/[eventId]/page.tsx
├── a/[shareSlug]/
│   └── page.tsx
├── api/
│   ├── events/route.ts
│   ├── events/[eventId]/share/route.ts
│   ├── share/[shareSlug]/join/route.ts
│   ├── albums/[albumId]/media/route.ts
│   ├── media/[mediaId]/tags/route.ts
│   ├── tags/[tagId]/route.ts
│   └── upload-intents/route.ts
└── layout.tsx

components/
├── event-form.tsx
├── media-grid.tsx
├── tag-editor.tsx
├── upload-dropzone.tsx
└── qr-share-panel.tsx

lib/
├── auth/
│   ├── organizer.ts
│   └── guest-session.ts
├── db/
│   ├── queries/
│   └── schema-types.ts
├── media/
│   ├── r2.ts
│   ├── upload-intents.ts
│   └── variants.ts
├── nicknames/
│   └── assign.ts
├── tags/
│   └── normalize.ts
└── validation/
    └── event.ts

supabase/
├── migrations/
└── seed.sql

tests/
├── contract/
├── e2e/
├── integration/
└── unit/
```

**Structure Decision**: Use a single Next.js full-stack application. Route
handlers and server actions own write paths, Supabase RLS enforces data access,
and R2 handles media originals. This avoids a separate backend service for the
MVP while keeping storage and security boundaries explicit.

## Complexity Tracking

No constitution violations currently require justification.
